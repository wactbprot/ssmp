/**
 * @module work.select
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , broker   = require("sc-broker")
  , conf     = require("./conf")
  , compare  = require("./compare")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.select",
                                    streams: conf.log.streams
                              })
  , mem      = broker.createClient({port: conf.mem.port})
  , ctrlstr  = conf.ctrlStr
  , ro       = {ok: true}
  , err;

/**
 *
 * @method select
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){
  var path         = task.Path
    , TaskDefClass = task.DefinitionClass


  if(TaskDefClass && path && _.isArray(path)){
    var mpid  = path[0]
      , no    = path[1];
    mem.get([mpid, "definitions"], function(err, definitions){
      if(!err){
        if(definitions && _.isArray(definitions)){

          var Ndef =  definitions.length;
          for(var i = 0; i < Ndef; i++){
            var def = definitions[i];
            if(def.DefinitionClass == TaskDefClass && def.Condition){
              var Ncond = definitions[i].Condition.length
              log.trace(ro
                      , "found matching DefinitionClass: "
                      + TaskDefClass
                      + " have to investigate "
                      + Ncond + " condition(s)");
              check_def(task, def, 0, cb);
            }else{
              log.trace(ro
                      , "DefinitionClass " + definitions[i].DefinitionClass +
                       " don't match task demand " + TaskDefClass );
            }
          } // for i
        }else{
          err = new Error("missing or wrong definitions");
          log.error(err
                   , "error on attempt to get definitions");
          if(_.isFunction(cb)){
            cb(err);
          }
        }
      }else{
        log.error(err
                 , "error on attempt to get definitions");
        if(_.isFunction(cb)){
          cb(err);
        }
      }
    }); // get definitions
  }else{
    err = new Error("wrong task");
    log.error(err
             , "task contains no definition class key or unvalid path");
    if(_.isFunction(cb)){
      cb(err);
    }
  }
}

var check_def = function(task, def, j, cb){
    var path    = task.Path
    , mpid      = path[0]
    , no        = path[1]
    , N         = def.Condition.length
    , cond      = def.Condition[j]
    , load_run  = ctrlstr.load + ";" + ctrlstr.run
    , load_stop = ctrlstr.load + ";" + ctrlstr.stop;
    
    mem.get([mpid,"exchange"].concat(cond.ExchangePath.split(".")), function(err, exval){
	if(!err){
	    if(_.isUndefined(exval) || _.isNull(exval) || _.isNaN(exval)){
        err = new Error("uncomparable exchange value");
        log.error(err
                 , "exchange value some kind of undefined");
      }else{
        log.trace(ro
                , "successful get value:"
                + exval
                +" from exchange");

        if(cond.Methode && compare[cond.Methode] && _.isFunction){
          if(compare[cond.Methode](exval, cond.Value)){
            if(j == N -1 ){
              log.trace(ro
                      , "found matching definition, "
                      + "try to load and run");

              mem.publish("stop_container_obs", [mpid, no], function(err){
                if(!err){
                  log.trace(ro
                          , "container: "
                          + no
                          + " stoped");
                  mem.set([mpid, no, "definition"], def.Definition, function(err){
                    if(!err){
                      log.trace(ro
                              , "set definition for container: "
				+ no );
			var set_cmd = task.Break == ctrlstr.yes ? load_stop : load_run;
			mem.set([mpid, no, "ctrl"], set_cmd, function(err){
                        if(!err){
                          log.trace(ro
                                  , "set ctrl for container: "
                                  + no
                                  + " to "
                                  + set_cmd);
                          mem.publish("start_container_obs", [mpid, no], function(err){
                            if(!err){
                              log.trace(ro
                                      , "start observing container");
				cb(null, {end: true});
                            }else{
                              log.error(err
					, "on attempt to publish to "
					+ "start_container_obs channel");
				if(_.isFunction(cb)){
                                    cb(err);
                              }
                            }
                          });
                        }else{
                          log.error(err
                                   , "on attempt to set ctrl");
                          if(_.isFunction(cb)){
                            cb(err);
                          }
                        }
                      });
                    }else{
                      log.error(err
                               , "on attempt to set definition");
                      if(_.isFunction(cb)){
                        cb(err);
                      }
                    }
                  });
                }else{
                  log.error(err
                           , "on attempt to publish to "
                           + "stop_container_obs channel");
                  if(_.isFunction(cb)){
                    cb(err);
                  }
                }
              });
            }else{
              log.trace(ro
                      , "check next state; call  with ");
              check_def(task, def, j + 1, cb);
            }
          }else{
            log.trace(cond
                    , "condition don't match");
          }
        }else{
          err = new Error("unknown condition Methode");
          if(_.isFunction(cb)){
            cb(err);
          }
        }
      }
    }else{
      log.error(err
               , "error on attempt to read from "
               + cond.ExchangePath);
    }
  }); // get exch
}
