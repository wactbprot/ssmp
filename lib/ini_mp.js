var name     = "ssmp"
  , _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , ndata    = require("ndata")
  , deflt    = require("./default")
  , request  = require("./request")
  , net      = require("./net")
  , log      = bunyan.createLogger({name: deflt.appname})
  , ctrlstr  = deflt.ctrlStr;

var mem = ndata.createClient({port: 9000});

/**
 * Die Funktion ```ini_mp()``` initialisiert eine
 * MP-Instanz.
 *
 * Wird ein Objekt im request body übergeben, wird
 * dieses benutzt. Wird der String ```load``` gesandt,
 * wird versucht das Dokument von der Datenbank zu
 * beziehen.
 *
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var ini_mp = function(req, cb){

  var ro
    , ok    = {ok: true}
    , id    = req.params.id
    , rb    = req.body;

  if(_.isString(rb)){
    if(rb === ctrlstr.load){
      log.info(ok
               , "try loading from database");
      var con = net.rddoc(id);
      request.exec(con, false, false, function(mpdoc){
        log.info(ok
                ,"receive mp definmition from data base");
        mem.publish("build", mpdoc, function(err){
          if(!err){
            cb(ok);
          }else{
            cb({error:err});
          }
        });
      });
    }else{
      log.info(ok
              , "try to parse body")
      // ---
      var mpdoc = JSON.parse(rb);
      // ---
      if(_.isObject(mpdoc) && _.isObject(mpdoc.Mp)){
        log.info(ok
                ,"received mp definition by post request, try to build mp")
        mem.publish("build", mpdoc, function(err){
          if(!err){
            cb(ok);
          }else{
            cb({error:err});
          }
        });
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
