var  name    = "http-ssmp"
  , _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , ndata    = require("ndata")
  , deflt    = require("./default")
  , request  = require("./request")
  , net      = require("./net")
  , log      = bunyan.createLogger({name: name})
  , ctrlstr  = deflt.ctrlStr
  , ok       = {ok:true}

var mem = ndata.createClient({port: 9000});

mem.subscribe("handle_cd", function(err){
  if(!err){
    log.info(ok
            , "observe.js subscribed to buildup channel");
  }
});

mem.on('message', function(ch, data){
  if(ch == "handle_cd"){
    var req;
    if(data.id && data.cmd && data.cdid){
      req = {
        params:{id   : data.id,
                cdid : data.cdid},
        body: data.cmd
      }
    }
    if(req)
      handle_cd(req, function(res){
        log.info(ok
                , "cd changed");
      });
  }
});

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
    , id    = req.params.id
    , rb    = req.body;

  if(_.isString(rb)){
    if(rb == ctrlstr.load){
      log.info(ok
              , "try loading from database");
      var con = net.rddoc(id);
      request.exec(con, false, false, function(mpdoc){
        log.info(ok
                ,"receive mp definition from data base");
        mem.publish("load_mp", mpdoc, function(err){
          if(!err){
            cb(ok);
          }else{
            cb({error:err});
          }
        });
      });
    }
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
    } // not string and not object
  }
};
exports.load_mp =  load_mp;


/**
 * ```cdid``` speichert nicht nur
 * die id der Kalibrierdokumente
 * sondern besorgt auch noch einige
 * Infodaten über die entsprechnende
 * Kalibrierung, welche dann unter
 * dem key id aufbewahrt werden bzw.
 * abgefragt werden können
 *
 */

var handle_cd = function(req, cb){
  var ro     = {ok: true}
    , id     = req.params.id
    , cdid   = req.params.cdid
    , cmd    = req.body;

  if(id && cmd && cdid){
    if(cmd === "remove"){
      var  path_i = [id, "id", cdid];
      log.info({ok: true}
              ,"try to remove id: " + cdid);
      mem.remove( path_i, function(err){
        if(!err){
          mem.publish("cd_change", path_i, function(err){
              if(!err){
                log.info(ro
                        ,"doc with id: " + cdid + "removed");
              }else{
                ro = {error:err};
                log.error({error:err}
                         , "on attempt to publish to handle_cd channel");
              }
          }); // publish
        }else{
          ro = {error: err}
          log.error(ro
                   , "on attempt to remove cd: "  + cdid );
        }
        if(_.isFunction(cb)){
          cb(ro);
        }
      }); // remove
    }
    if(cmd === "load"){
      log.info({ok: true}
              ,"try to add id: "
              + cdid);
      var con = net.docinfo(cdid);
      request.exec(con, false, false, function(docinfo){
        log.info(ok
                ,"receive doc info data, try to store ");
        var  path_i = [id, "id", cdid];
        mem.set(path_i, docinfo, function(err){
          if(!err){
            mem.publish("cd_change", path_i, function(err){
              if(!err){
                log.info(ro
                        ,"doc added see mpid/id/"
                        + cdid);
              }else{
                ro = {error:err};
                log.error(ro
                         , "on attempt to publish to handle_cd channel");
              }
            }); // publish
          }else{
            ro = {error: err};
            log.error(ro
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
exports.handle_cd = handle_cd


var put = function(req, cb){
  var ro
    , path     = get_path(req)
    , strpath  = path.join(" ")

  mem.set(path, req.body, function(err){
    if(!err){
      ro = ok;
      log.info(ok
              , "set value to path: " + strpath);
    }else{
      ro = {error:err}
      log.error(ro
               , "set value to path: " + strpath);
    }
    cb(ro);
  });
}
exports.put = put;

var get = function(req, cb){
  var ro
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
  var path = [];

  if(req.params){
    var id   = req.params.id
      , no   = req.params.no
      , s    = req.params.struct
      , l1   = req.params.l1
      , l2   = req.params.l2
      , l3   = req.params.l3;

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
  }
  return path;
}
exports.get_path = get_path;
