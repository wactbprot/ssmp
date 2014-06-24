var _        = require("underscore"),
    deflt    = require("./default"),
    oputils  = require("./oputils"),
    net      = require("./net");

exports.get = function(mps, req){
  var msg, ro, obj,
      id     = req.params.id,
      struct = req.params.struct;

  if(id        &&
     mps       &&
     mps[id]){

    if(struct  &&
       mps[id][struct]){

      obj = mps[id][struct].get(getpath(req));

    }else{

      obj = oputils.build.down(mps[id]);

    }

    if(_.isUndefined(obj)){
      msg = "found nothing";
      ro  = {error: msg};
      req.log.error(ro, msg);
    }else{
      msg = "object sent back";
      
      if(_.isObject(obj) || _.isArray(obj)){
        ro = obj;
      }else{
        ro  = {result:obj}
      };
      req.log.debug({ok:true}, msg);
    }
  }else{
    msg = "nothing in the path";
    ro  = {error: msg};
    req.log.error(ro, msg);
  }
  return ro;
}


exports.del = function(mps, req, cb){
  var msg, ro,
      id     = req.params.id,
      struct = req.params.struct;

  if(id            &&
     struct        &&
     mps           &&
     mps[id]       &&
     mps[id][struct]){

    req.log.info({ok: true}, "try to delete");

    mps[id][struct].del(getpath(req), cb);

  }else{
    msg = "not a valid path";
    ro = {error: msg};
    req.log.error(req, msg);
    cb(ro);
  }
};

exports.put = function(mps, req, cb){
  var msg, ro, path, value,
      ok     = true,
      id     = req.params.id,
      struct = req.params.struct,
      obj    = req.body;

  if(id            &&
     struct        &&
     mps           &&
     mps[id]       &&
     mps[id][struct]){

    mps[id][struct].set(getpath(req), obj, cb);

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
        cdid   = req.params.cdid,
        cmd    = req.body;

  if(id            &&
     mps           &&
     mps[id]       &&
     mps[id].id    &&
     cmd           &&
     cdid){

    if(cmd === "load"){
      var mp   = mps[id],
          opts = net.docinfo(mp, cdid);
      req.log.info({ok: true}, "try to add id: " + cdid   );

      net.dbcon(mp).relax(opts, function(err, info){
        if(_.isObject(info)){
          mp.id.set([cdid], info, cb)
        }
        if(err){
          req.log.error({error:"request failed"}, err)
        }
      });
    }

    }else{
      msg = "not a valid path";
      ro = {error: msg};
      req.log.error(req, msg);
      cb(ro);
    }
};

var getpath = function(req){
  var path = [],
      struct = req.params.struct,
      l1   = req.params.l1,
      l2   = req.params.l2,
      l3   = req.params.l3,
      msg  = "request to " + struct + "/";

  if(l3 && l2 && l1){
    req.log.info({ok: true}, msg + l1 + "/" + l2 + "/"+ l3 );
    path = [l1, l2, l3];
  }

  if(l2 && l1 && !l3){
    req.log.info({ok: true}, msg + l1 + "/" + l2 );
    path = [l1, l2];
  }

  if(l1 && !l2 && !l3){
    req.log.info({ok: true}, msg + l1 );
    path = [l1];
  }
  if(!l1 && !l2 && !l3){
    req.log.info({ok: true}, msg  );
  }
  return path;
}
