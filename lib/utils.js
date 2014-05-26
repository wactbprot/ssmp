
var _ = require("underscore");

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

exports.idput = function(mps, req, cb){
    var msg, ro,
        id     = req.params.id,
        cid    = req.body;
  if(id            &&
     mps           &&
     mps[id]       &&
     mps[id].id){

      req.log.info({ok: true}, "try to add id: " + cid   );

      mps[id].id.set(cid, cb);

    }else{
      msg = "not a valid path";
      ro = {error: msg};
      req.log.error(req, msg);
      cb(ro);
    }
};

exports.idget = function(mps, req){
    var msg, ro,
        id     = req.params.id;
  if(id            &&
     mps           &&
     mps[id]       &&
     mps[id].id){

    msg = "id array sent back";
    ro  = {result: mps[id].id.get()};
    req.log.debug({ok:true}, msg);;
  }

  return ro;
};

exports.iddel = function(mps, req, cb){
  var msg, ro,
      id     = req.params.id;

  if(id            &&
     mps           &&
     mps[id]       &&
     mps[id].id){

    if(req.body !== "undefined"){
      mps[id].id.del(req.body, cb);
      msg = "id: " + req.body + "deleted";
    }else{
      mps[id].id.rst(cb);
      msg = "id array deleted";
    }
    req.log.debug({ok:true}, msg);;
  }
};
