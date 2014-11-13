var name     = "ssmp"
  , _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , deflt    = require("./default")
  , request  = require("./request")
  , build    = require("./build")
  , net      = require("./net")
  , log      = bunyan.createLogger({name: deflt.appname})
  , ctrlstr  = deflt.ctrlStr;

/**
 * Die Funktion ```ini_mp()``` initialisiert eine
 * MP-Instanz.
 *
 * Wird ein Objekt im request body übergeben, wird
 * dieses benutzt. Wird der String ```load``` gesandt,
 * wird versucht das Dokument von der Datenbank zu
 * beziehen.
 *
 * @param {Object} mps globalse MP-Objekt
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var ini_mp = function(mps, req, cb){

  var ro,
      id    = req.params.id,
      rb    = req.body;

  if(mps.hasOwnProperty(id)){
    log.warn({warn:"ini again"}
             ,"already initialized, try again")
  }else{
    log.info({ok:true}
            ,"receive new mp id: "
            + id);
  }

  //-----------
  mps[id] = {};
  //-----------

  if(_.isString(rb)){
    if(rb === ctrlstr.load){
      log.info({ok: true},
               "try loading from database");

      var con = net.rddoc(false, id);
      // (mp, con, task, path, wrtdata, cb)
      request.exec(con, false, false, function(mpdoc){
        log.info({ok:true}
                ,"receive mp definmition from data base");
        build(mpdoc, cb)
      });
    }else{
      log.info({ok:true},
               "try to parse body")

      var mpd = JSON.parse(rb);
      if(_.isObject(mpd) &&
         _.isObject(mpd.Mp)){
        log.info({ok:true}
                ,"received mp definition by post request, try to build mp")
        build(mpd, cb);

      }else{
        ro = {error:"no object" }
        log.error(ro
                 ,"can not parse post body to an object")
        if(_.isFunction(cb)){
          cb(ro)
        }
      }
    }
  }else{
    ro = {error:"error on mp ini" }
    log.error(ro
             ,"can not understand post body")
    if(_.isFunction(cb)){
      cb(ro)
    }
  }
};
module.exports =  ini_mp;
