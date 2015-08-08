var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require("ndata")
  , deflt    = require("./default")
  , compare  = require("./compare")
  , log      = bunyan.createLogger({name: deflt.app.name + ".worker.select"})
  , mem      = ndata.createClient({port: deflt.mem.port})
  , ctrlstr  = deflt.ctrlStr
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
              log.info(ro
                      , "found matching DefinitionClass: "
                      + TaskDefClass
                      + " have to investigate "
                      + Ncond + " condition(s)");
              check_def(path, def, 0, cb);
            }else{
              log.info(ro
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

var check_def = function(path, def, j, cb){
  var mpid     = path[0]
    , no       = path[1]
    , N        = def.Condition.length
    , cond     = def.Condition[j]
    , load_run = ctrlstr.load + ";" + ctrlstr.run;

  mem.get([mpid,"exchange"].concat(cond.ExchangePath.split(".")), function(err, exval){
    if(!err){
      if(_.isUndefined(exval) || _.isNull(exval) || _.isNaN(exval)){
        err = new Error("uncomparable exchange value");
        log.error(err
                 , "exchange value some kind of undefined");
      }else{
        log.info(ro
                , "successful get value:"
                + exval
                +" from exchange");

        if(cond.Methode && compare[cond.Methode] && _.isFunction){
          if(compare[cond.Methode](exval, cond.Value)){
            if(j == N -1 ){
              log.info(ro
                      , "found matching definition, "
                      + "try to load and run");

              mem.publish("stop_container_obs", [mpid, no], function(err){
                if(!err){
                  log.info(ro
                          , "container: "
                          + no
                          + " stoped");
                  mem.set([mpid, no, "definition"], def.Definition, function(err){
                    if(!err){
                      log.info(ro
                              , "set definition for container: "
                              + no );
                      mem.set([mpid, no, "ctrl"], load_run, function(err){
                        if(!err){
                          log.info(ro
                                  , "set ctrl for container: "
                                  + no
                                  + " to "
                                  + load_run);
                          mem.publish("start_container_obs", [mpid, no], function(err){
                            if(!err){
                              log.info(ro
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
              log.info(ro
                      , "check next state; call  with ");
              check_def(path, def, j + 1, cb);
            }
          }else{
            log.info(cond
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