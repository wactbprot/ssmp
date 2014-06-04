var _        = require("underscore"),
    d        = require("./defaults"),
    net      = require("./net");

exports.get = function(mps, req){
  var msg, ro, obj,
      id     = req.params.id,
      struct = req.params.struct,
      path   = req.params.path,
      mp     = mps[id];

  if( struct        &&
      mp[struct]){

    if(path){
      var p  = path.split("/");
      obj = mp[struct].get(p);
    }else{
      obj = mp[struct].get();
    }

    if(_.isUndefined(obj)){
      msg = "found nothing";
      ro  = {error: msg};
      req.log.error(ro, msg);
    }else{
      msg = "object sent back";
      ro  = {result:obj};
      req.log.debug({ok:true}, msg);
    }
  }else{
    msg = "nothing in the path";
    ro  = {error: msg};
    req.log.error(ro, msg);
  }
  return ro;
}


exports.put = function(mps, req, cb){
    var msg, ro,
        id     = req.params.id,
        struct = req.params.struct,
        path   = req.params.path.split("/"),
        obj    = req.body;

    if(id            &&
       struct        &&
       mps           &&
       mps[id]       &&
       mps[id][struct]){

      req.log.info({ok: true}, "try to set");
      mps[id][struct].set(path, obj, cb);

    }else{
      msg = "not a valid path";
      ro = {error: msg};
      req.log.error(req, msg);
      cb(ro);
    }
};

exports.del = function(mps, req, cb){
  var msg, ro,
      id     = req.params.id,
      struct = req.params.struct,
      path   = req.params.path.split("/");
  if(id            &&
     struct        &&
     mps           &&
     mps[id]       &&
     mps[id][struct]){

    req.log.info({ok: true}, "try to delete");

    mps[id][struct].del(path, cb);

  }else{
    msg = "not a valid path";
    ro = {error: msg};
    req.log.error(req, msg);
    cb(ro);
  }
};

/**
 * ```idput``` speichert nicht nur
 * die id der Kalibrierdocumente
 * sondern besorgt auch noch einige
 * Infodaten über die entsprechnende
 * Kalibrierung, welche dann unter
 * dem key id aufbewahrt werden bzw.
 * abgefragt werden können
 *
 */
exports.idput = function(mps, req, cb){
    var msg, ro,
        id     = req.params.id,
        cid    = req.body;

  if(id            &&
     mps           &&
     mps[id]       &&
     mps[id].id){

    var mp   = mps[id],
        opts = net.docinfo(mp, cid);
    req.log.info({ok: true}, "try to add id: " + cid   );

    net.dbcon(mp).relax(opts, function(err, info){
      if(_.isObject(info)){
        mp.id.set([cid], info, cb)
      }
      if(err){
        req.log.error({error:"request failed"}, err)
      }
    });


    }else{
      msg = "not a valid path";
      ro = {error: msg};
      req.log.error(req, msg);
      cb(ro);
    }
};
