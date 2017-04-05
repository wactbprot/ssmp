/**
 * @module load.distribute
 */
var _       = require("underscore")
  , bunyan  = require("bunyan")
  , broker   = require("sc-broker")
  , clone   = require("clone")
  , conf    = require("./conf")
  , fetch   = require("./load.fetch")
  , utils   = require("./utils")
  , ok      = {ok:true}, err
  , log     = bunyan.createLogger({name: conf.app.name + ".load.distribute",
                                   streams: conf.log.streams})
  , mem      = broker.createClient({port: conf.mem.port});;

/**
 * Bearbeitet die expandierte Definition und veranlasst
 * den Datenbankabruf der einzelnen Tasks.
 * @method distribute
 * @param {Array} path Pfad-array
 * @param {Array} def expandiertes Definitionsobjekt
 * @param {Array} meta für mp-Name und Standard
 * @param {Function} cb callback
 */
module.exports = function (path, def, meta, cb){
  mem.get(["defaults"], function(err, defaults){
    if(path && _.isArray(path)
            && (path.length >= 2)
            && meta
            && _.isObject(meta)){
      var mpid  = path[0]
        , no    = path[1]
        , d     = 0;
      if( def && _.isArray(def)
              && (def.length > 0)
              && _.isArray(def[0])
              && (def[0].length > 0)
              && _.isObject(def[0][0])){
        var ns = def.length
          , sd
          , pd
          , sem = function (){
                    var isem = 0;
                    return function (def, s, p){
                      var cds      = clone(def[s][p]);
                      cds.MpName   = meta.name;
                      cds.Standard = meta.standard;
                      isem++;
                      // see https://github.com/wactbprot/ssmp/issues/19
                      var delay = isem * defaults.system.db_delay_mult;
                      setTimeout(function(){
                        log.trace(ok,
                                  "start fetch task with a delay of: " + delay);
                        fetch([mpid, no],[s, p], cds, function (err){
                          if(err){
                            log.error(err,
                                      "error of attempt to fetch task");
                            cb(err);
                          }else{
                            isem--;
                            if(isem == 0){
                              cb(null, [mpid, no]);
                            }
                          }
                        });
                      }, delay);
                    }}();

        for(sd = 0; sd < ns; sd++){
          var np = def[sd].length;
          for(pd = 0; pd < np; pd++){
            sem(def, sd, pd);
          } // for pd
        } // for sd

      }else{
        err = new Error("wrong definition");
        log.error(err
                 , "wrong definition");

        if(_.isFunction(cb)){
          cb(err);
        }
      }
    }else{
      err = new Error("wrong path or meta object");
      log.error(err
               , "wrong path or meta object");

      if(_.isFunction(cb)){
        cb(err);
      }
    }
  }); // defaults
}
