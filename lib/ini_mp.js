var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require("bunyan"),
    deflt    = require("./default"),
    request  = require("./request"),
    build    = require("./build"),
    net      = require("./net"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * Die Funktion ```ini_mp()``` initialisiert ein MP.
 *
 * Wird ein Objekt im request body übergeben wird
 * dieses benutzt. Wird der String ```load``` gesandt,
 * wird versucht das dokument von der Datenbank zu
 * beziehen.
 *
 * @param {Object} mps globalse MP-Objekt
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var ini_mp = function(mps, req, cb){

  var id    = req.params.id,
      rb    = req.body;

  if(mps.hasOwnProperty(id)){
    log.warn({warn:"ini again"},
             "already initialized, try again")
    mps[id]  = {};
  }else{
    log.info({ok:true},
             "receive new mp id: " + id);
    mps[id]  = {};
  }

  if(_.isString(rb)){
    if(rb === ctrlstr.load){
      log.info({ok: true},
               "try loading from database");

      var con = net.rddoc(false, id);
      request.exec(mps[id], false, false, con, false, false, cb)
    }else{
      log.info({ok:true},
               "try to parse body")

      var mpd = JSON.parse(rb);
      console.log(mpd );
      if(_.isObject(mpd) &&
         _.isObject(mpd.Mp)){
        log.info({ok:true},
                 "received mp definition by post request, try to build mp")
        build(mps[id], mpd, cb);
      }
    }
  }else{
    log.error({error:"error on mp ini" },
             "can not understand post body")

  }
};
module.exports =  ini_mp;
