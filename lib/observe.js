var _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , ndata    = require('ndata')
  , utils    = require("./utils")
  , deflt    = require("./default")
  , log      = bunyan.createLogger({name: deflt.app.name})
  , sh       = deflt.system.heartbeat
  , ch       = deflt.container.heartbeat
  , cstr     = deflt.ctrlStr
  , timerId  = {}
  , ok       = {ok:true}
  , err
  , mem      = ndata.createClient({port: deflt.mem.port});

/**
 * Description
 * @method ini
 * @param {Function} cb
 */
var ini = function (cb){
  mem.subscribe("stop_all_container_obs", function (err){
    if(!err){
      log.info(ok
              , "observe.js subscribed to stop_all_container_obs channel");
      mem.subscribe("start_container_obs", function (err){
        if(!err){
          log.info(ok
                  , "observe.js subscribed to start_container_obs channel");

          mem.subscribe("stop_container_obs", function (err){
            if(!err){
              log.info(ok
                      , "observe.js subscribed to stop_container_obs channel");

              mem.subscribe("executed", function (err){
                if(!err){
                  log.info(ok
                          , "observe.js subscribed to executed channel");

                  mem.subscribe("stop", function (err){
                    if(!err){
                      log.info(ok
                              , "observe.js subscribed to stop channel");
                      if( _.isFunction (cb)){
                        cb(null, ok);
                      }
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}
exports.ini = ini;

mem.on('message',function (ch, path){
  if( ch == "executed"
   || ch == "stop"
   || ch == "stop_container_obs"
   || ch == "stop_all_container_obs"
   || ch == "start_container_obs"){
    observe(ch, path)
  }
});

/**
 * Die Funktion ```observe()``` beobachtet periodisch
 * die ```/ctrl``` Schnittstelle aller _Container_ des
 * Messprogramms  und deren ```/state``` (Zustand der einzelnen Tasks).
 *
 * Für den Fall, dass alle
 * ```state```s eines _Containers_  den Wert ```executed```
 * besitzen, wird deren Wert auf  ```ready``` zurückgesetzt.
 *
 * Der _Container gilt dann als abgearbeitet.
 * Der ```/ctrl``` String des _Containers_ wird daraufhin
 * ebenfalls auf den Wert ```ready``` gesetzt.
 *
 * Die Funktion wird durch den
 * Messprogramminitialisierungsprozess gestartet; jeder
 * Container besitzt seinen eigenen timer.
 *
 * Die ```observe()``` Funktion reagiert auf:
 *
 * - load
 * - run
 * - stop
 *
 * Darüber hinaus werden die beiden ```/exchange```
 * Objekte:
 * ```
 * "start_time": {
 *     "Value": {
 *         "value": 1408712602709
 *     },
 *     "Unit": {
 *         "value": "ms"
 *     }
 * }
 * ```
 * und
 * ```
 * "run_time": {
 *     "Unit": {
 *         "value": "ms"
 *     },
 *     "Value": {
 *         "value": 928429
 *     }
 *
 * }
 * ```
 * erstellt; letzterer periodisch aufgefrischt.
 * @param {String} ch Channel
 * @param {Array} path Pfad
 * @param {Function} cb callback
 */
var observe = function (ch, path, cb){
  if(path && _.isArray(path) && path.length >= 1){
    var strpath = path.join(" ")
      , mpid    = path[0]
      , no      = path[1]
    log.info(ok
            , "observe() receice message on channel: " + ch + " for path: " + strpath);

    if(ch == "executed" || ch == "stop"){
      mem.get([mpid, no, "recipe"], function (err, recipe){
        if(!err){
          utils.cp(recipe , cstr.ready, function(err, recipecp){
            if(!err){
              mem.set([mpid, no, "state"], recipecp, function(err){
                if(!err){
                  mem.publish("state", path, function (err){
                    if(!err){
                      mem.get([mpid, no, "ctrl"], function (err, cmdstr){
                        if(!err){
                          if(cmdstr == "" || cmdstr == "stoping" ){
                            mem.set([mpid, no, "ctrl"], cstr.ready, function (err){
                              if(!err){
                                log.info(ok
                                        , "set container to ready");
                                if(_.isFunction(cb)){
                                  cb(null, path);
                                }
                              }else{
                                log.error(err
                                         , "on attempt to set container to ready");
                                if(_.isFunction(cb)){
                                  cb(err, path);
                                }
                              }
                            }); // ctrl set
                          } // cmd == ""
                        }else{
                          log.error(err
                                   , "on attempt to get container ctrl");
                          if(_.isFunction(cb)){
                            cb(err, path);
                          }
                        }
                      }); // ctrl ge
                    }else{
                      log.error(err
                               , "on attempt to publish");
                      if(_.isFunction(cb)){
                        cb(err, path);
                      }
                    }
                  }); // publish state
                }else{
                  log.error(err
                           , "on attempt to set state");
                  if(_.isFunction(cb)){
                    cb(err, path);
                  }
                }
              }); // set new state
            }else{
              err = new Error("cp error");
              log.error(err
                       , "on attempt to cp");
              if(_.isFunction(cb)){
                cb(err, path);
              }
            }
          });
        }else{
          log.error(err
                   , "error on try to get recipe");
          if(_.isFunction(cb)){
            cb(err, path);
          }
        }
      });
    } // if executed

    if(ch == "stop_container_obs" || ch == "stop_all_container_obs"){
      stop_cont(path, ch, timerId, function(err, path){
        if(!err){
          log.info(ok
                  , "clear interval on event stop_container_obs for path:  " + strpath);
          if(_.isFunction(cb)){
            cb(null, path);
          }
        }else{
          log.error(err
                   , "error on attempt to clear interval "
                   + "on event stop_container_obs for path:  "
                   + strpath)
          if(_.isFunction(cb)){
            cb(err, path);
          }
        }
      });
    } // if stop_(all)_container_obs

    if(ch == "start_container_obs"){
      time_to_exchange(path, true, function(err, path){
        log.info(ok
                , "start observing " + mpid + " with " + sh + "ms");
        if(!timerId[mpid]){
          timerId[mpid] = {};
        }
        if(!timerId[mpid][no]){
          timerId[mpid][no] = setInterval(function (){
                                time_to_exchange(path, false, function(err, path){
                                  mem.get([mpid, no, "ctrl"], function (err, cmdstr){
                                    mem.get([mpid, no, "state"], function (err, state){
                                      dispatch([mpid, no, "ctrl"], cmdstr, state, function (err, path){
                                        if(!err){
                                          if(_.isFunction(cb)){
                                            cb(null, path);
                                          }
                                        }else{
                                          log.error(err
                                                   , "error on observe dispatch");
                                          stop_cont(path, "stop_container_obs", timerId, cb)
                                        }
                                      });
                                    });
                                  });
                                }); // time
                              }, sh); // intervall
        }else{ // timerId ae
          log.info(ok
                  , " observe timer for " + mpid + " already runs")
        }
      }); // time to exchange
    }// if start_container_obs
  }else{
    err = new Error("wrong path");
    log.error(err
             , "error on observe path");
    if(_.isFunction(cb)){
      cb(err, path);
    }
  }
}
exports.observe = observe;

var dispatch = function(path, cmdstr, state, cb){
  if(path && _.isArray(path) && path.length >= 2){
    var mpid = path[0]
      , no   = path[1];

    if(_.isString(cmdstr)){

      var cmd        = _.first(cmd_to_array(cmdstr))
        , flat_state = utils.as_arr(state)
        , all_exec   = utils.all_same(flat_state, cstr.exec);

      if( all_exec ){
        switch(cmd){
          case "monitoring":
          shout([mpid, no], cstr.exec, cmdstr, cstr.mon, cb);
          break;

          case "":
          shout([mpid, no], cstr.exec, cmdstr, cstr.ready, cb);
          break;

          default:
          shout([mpid, no], cstr.exec, cmdstr, "", cb);
          break;
        }
      }else{
        switch(cmd){
          case cstr.stop:
          shout([mpid, no], cstr.stop, cmdstr, "stoping", cb);
          break;

          case cstr.mon:
          shout([mpid, no], cstr.run, cmdstr, "monitoring", cb);
          break;

          case cstr.load:
          shout([mpid, no], cstr.load, cmdstr, "loading", cb);
          break;

          case cstr.run:
          shout([mpid, no], cstr.run, cmdstr, "running", cb);
          break;

          case "":
          if(_.isFunction(cb)){
            err = new Error("empty cmd");
            cb(err, path);
          }
        } // switch
      } // else all_exec
    } // cmdstr is string
  }else{
    if(_.isFunction(cb)){
      err = new Error("wrong path");
      cb(err, path);
    }
  }
}
exports.dispatch = dispatch;

var time_to_exchange = function(path, first, cb){
  if(path && _.isArray(path) && path.length >= 1){
    var mpid   = path[0]
    if(first){
      var date   = new Date()
        , stime  = date.getTime()

      var val = {Value:stime, Unit:"ms"};
      mem.set([mpid, "exchange","start_time"], val, function (err){
        if(_.isFunction(cb)){
          cb(null, path);
        }
      });
    }else{
      mem.get([mpid, "exchange","start_time"], function(err, res){
        var val = {Value: (new Date()).getTime() - res.Value,
                   Unit:"ms"}
        mem.set([mpid, "exchange","run_time"], val, function (err){
          if(_.isFunction(cb)){
            cb(null, path);
          }
        });
      });
    }
  }else{
    if(_.isFunction(cb)){
      err = new Error("wrong path");
      cb(err, path);
    }
  }
}
exports.time_to_exchange = time_to_exchange;

/**
 * Publiziert Änderungen
 * @method shout
 * @param {Array} path
 * @param {String} cmdstr
 * @param {Number} no
 * @param {String} cstr
 * @param {String} channel
 */
var shout = function (path, channel, cmdstr, newstr, cb){
  if(path && _.isArray(path) && path.length >= 2){

    var cmdarr = cmd_to_array(cmdstr)
      , cmdH   = _.first(cmdarr)
      , cmdT   = _.rest(cmdarr)
      , mpid   = path[0]
      , no     = path[1]
      , ncmdstr;

    if(newstr){
      ncmdstr = [newstr].concat(cmdT).join(";")
    }else{
      ncmdstr = cmdT.join(";")
    }
    mem.set([mpid, no, "ctrl"], ncmdstr, function (){
      mem.publish(channel, [mpid, no], function (err){
        if(!err){
          log.info(ok
                  , "published on channel: " + channel);
          if(_.isFunction(cb)){
            cb(null, path);
          }
        }else{
          log.info(err
                  ,"error on publishing on channel: " + channel);
          if(_.isFunction(cb)){
            cb(err, path);
          }
        }
      }); // publish
    }); // set ctrl loading
  }else{
    if(_.isFunction(cb)){
      err = new Error("wrong path");
      cb(err, path);
    }
  }
}
exports.shout = shout;


var stop_cont = function(path, ch, timerId, cb){

  if(path && _.isArray(path) && path.length >= 1){
    var mpid = path[0];

    if(timerId[mpid] && _.isObject(timerId[mpid])){
      if(ch ==  "stop_all_container_obs"){
        for(var nno in  timerId[mpid]){
          clearInterval(timerId[mpid][nno]);
          timerId[mpid][nno] = 0;
          if(_.isFunction(cb)){
            cb(null, path)
          }
        }  // for
      }else if(ch == "stop_container_obs"){
        var no   = path[1]
        clearInterval(timerId[mpid][no]);
        timerId[mpid][no] = 0;
        if(_.isFunction(cb)){
          cb(null, path);
        }
      } else{
        if(_.isFunction(cb)){
          err = new Error("wrong channel");
          cb(err, path);
        }
      }
    }
  }else{// path
    if(_.isFunction(cb)){
      err = new Error("no or wrong path");
      cb(err, path);
    }
  }
}
exports.stop_cont = stop_cont;


/**
 * Die ```cmd_to_array()``` Funktion zerlegt die
 * unter ```Mp.Container[i].Ctrl``` bzw. ```http://.../mpid/ctrl```
 * angebbaren Steuerzeichen (_cmdstr_) und erzeugt daraus eien Array,
 * dessen erstes Feld den aktuellen Auftrag (load, run etc.)
 * beinhaltet; die Funktion ```observe()``` benutzt dieses erste Feld,
 * um entsprechende Funktionen auszuwählen.
 * Wenn der _cmdstr_ so aussieht:
 * ```
 * "load;run;stop"
 * ```
 * soll:
 * ```
 * ["load","run", "stop"]
 * ```
 * erzeugt werden. Sieht der _cmdstr_wie folgt aus:
 * ```
 * "load;2:run,stop"
 * ```
 * soll:
 * ```
 * ["load","run", "stop","run", "stop"]
 * ```
 * erzeugt werden. Steht an lezter Stelle der String ```mon```
 * wird immer wieder ```["mon"]``` zurückgeliefert.
 * @method cmd_to_array
 * @param {String} cmdstr Steuerstring
 */
var cmd_to_array = function (cmdstr){
  var arr = [],
      al1 = cmdstr.split(";");
  if( al1.length === 1 && al1[0] ===  cstr.mon){
    return [cstr.mon];
  }else{
    for(var i = 0; i < al1.length; i++){
      var al2 = al1[i].split(":");

      if(al2.length > 1){
        var rep    = parseInt(al2[0],10);
        if(_.isNumber(rep)){
          for(var j = 0; j < rep; j++){
            _.map(al2[1].split(","), function (c){arr.push(c)});
          }
        }
      }else{
        arr.push(al1[i]);
      }
    }
    return arr;
  }
};
exports.cmd_to_array = cmd_to_array;
