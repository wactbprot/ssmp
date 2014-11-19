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
var load_mp = function(req, cb){

  var ro
    , ok    = {ok: true}
    , id    = req.params.id
    , rb    = req.body;

  if(_.isString(rb)){
    if(rb == ctrlstr.load){
      log.info(ok
               , "try loading from database");
      var con = net.rddoc(id);
      request.exec(con, false, false, function(mpdoc){
        log.info(ok
                ,"receive mp definmition from data base");
        mem.publish("load_mp", mpdoc, function(err){
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
        mem.publish("load_mp", mpdoc, function(err){
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
exports.load_mp =  load_mp;


/**
 * ```cdid``` speichert nicht nur
 * die id der Kalibrierdocumente
 * sondern besorgt auch noch einige
 * Infodaten über die entsprechnende
 * Kalibrierung, welche dann unter
 * dem key id aufbewahrt werden bzw.
 * abgefragt werden können
 *
 */

var load_cd= function(req, cb){
  var ro     = {ok: true}
    , id     = req.params.id
    , cdid   = req.params.cdid
    , cmd    = req.body;

  if(id && cmd && cdid){
    if(cmd === "load"){
      log.info({ok: true}
              ,"try to add id: "
              + cdid);
      var con = net.docinfo(cdid);
      request.exec(con, false, false, function(docinfo){
        log.info({ok:true}
                ,"receive doc info data, try to store ");
        var  path_i = [id, "id", cdid];
        mem.set(path_i, docinfo, function(err){
          if(!err){
            mem.publish("load_cd", path_i, function(err){
              if(!err){
                log.info(ro
                        ,"doc added see mpid/id/"
                        + cdid);
              }else{
                ro = {error:err};
                log.error({error:err}
                         , "on attempt to poblish to load_cd channel");
              }
            }); // publish
          }else{
            ro = {error: err};
            log.error({error: err}
                     ,"error adding doc: " + cdid);
          }
          if(_.isFunction(cb)){
            cb(ro);
          }
        }); // set
      }); // request
    } // further commands like delete go here
  }else{
    ro = {error: "not a valid path"};
    log.error(ro
             ,"mp does not exist or no command given");
    cb(ro);
  }
};
exports.load_cd


var put = function(req, cb){
  var ro
    , ok       = {ok:true}
    , path     = get_path(req)
    , strpath  = path.join(" ")

  mem.set(path, req.body, function(err){
    if(!err){
      cb(ok);
      log.info(ok
              , "set value to path: " + strpath);

    }else{
      ro = {error:err}
      cb(ro);
      log.error(ro
                 , "set value to path: " + strpath);
    }
  });
}
exports.put = put;

var get = function(req, cb){
  var ro
    , ok   = {ok:true}
    , path = get_path(req);

  log.info(ok
          , "receice get request to path " + path.join(" "));
  mem.get(path, function(err, obj){
    if(err){
        ro = {error:err}
      log.error(ro
                 ,"error on get from mem");
    }else{
      if(_.isUndefined(obj)){
        ro = {error:"object is undefined"}
        log.error(ro
                 ,"found nothing in the path");
      }else{
          if(_.isObject(obj) || _.isArray(obj)){
            ro = obj;
            log.info(ok
                    , "sent object back");
          }else{
            ro  = {result:obj}
            log.info(ok
                    , "sent value back");
          };
        }
    }
    cb(ro)
  })
}
exports.get = get;

var get_path = function(req){
  var path = [],
      id   = req.params.id,
      no   = req.params.no,
      s    = req.params.struct,
      l1   = req.params.l1,
      l2   = req.params.l2,
      l3   = req.params.l3;

  if(id && no){
    path = [id, no];
    if(s){
      path = path.concat(s);
      if(l3 && l2 && l1){
        path = path.concat([l1, l2, l3]);
      }
      if(l2 && l1 && !l3){
        path = path.concat([l1, l2]);
      }
      if(l1 && !l2 && !l3){
        path = path.concat([l1]);
      }
    }
  }
  return path;
}
exports.get_path = get_path;