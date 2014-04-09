var md     = require("./generate").module,
    _      = require("underscore");


/**
 * --*-- get --*--
 *
 * GET
 * http://server:port/mpid/mp
 * http://server:port/mpid/param/database
 *
 * Bsp.:
 *
 * http://localhost:8001/mpid/mp
 *
 * ```mpid``` ist die ```id``` des Messprogrammdokuments
 * bzw. der Messprogrammdefinition
 */
var get =  function(mps, req){

  var path   = req.params[0].split("/"),
      id     = path.shift(),
      struct = path.shift(), // mp oder param ored id oder ...
      ro, msg;

  if(id            &&
     struct        &&
     mps           &&
     mps[id]       &&
     mps[id][struct]){

    var mp  = mps[id],
        obj = mp[struct].get(path);

    if(typeof obj === undefined){
      msg = "found nothing";
      ro  = {error:msg};

      req.log.error(ro, msg);

    }else{
      msg = "obj sent back";
      ro  = {result:obj};

      req.log.info(ro, msg);
    }
  }else{
    msg = "" + id + " not found";
    ro  = {error: msg};

    req.log.error(ro, msg);
  }
  return ro;
};
exports.get = get;

/**
 * --*-- set --*--
 *
 * SET
 * http://server:port/mpid/mp
 * http://server:port/mpid/param/database
 *
 * Bsp.:
 *
 * http://localhost:8001/mpid/mp
 *
 * ```mpid``` ist die ```id``` des Messprogrammdokuments
 * bzw. der Messprogrammdefinition
 */
var set =  function(mps, req){

  var path   = req.params[0].split("/"),
      id     = path.shift(),
      struct = path.shift(),
      obj    = req.body,
      ro, msg;


  if(typeof obj === "string"){
    obj = JSON.parse(obj);
    req.log.info(obj, "parsed from string");
  }

  if((typeof obj !== "undefined") &&
     id            &&
     struct        &&
     mps           &&
     mps[id]       &&
     mps[id][struct]){

    var mp  = mps[id],
        res = mp[struct].set(path, obj);

    if(typeof res === "undefined"){
      msg = "found nothing";
      ro  = {error:msg};

      req.log.error(ro, msg);

    }else{
      msg = "obj sent back";
      ro  = {result:obj};

      req.log.info(ro, msg);
    }
  }else{
    msg = "" + id + " not found";
    ro  = {error: msg};

    req.log.error(ro, msg);
  }
  return ro;
};
exports.set = set;
//    var db = nano("http://" +
//                  dp.get(database, server) + ":" +
//                  db.get(database, port)).use(db.get(database, name));
