var md     = require("./generate").module,
    _      = require("underscore");


/**
 * Get mp:
 *
 * GET
 * http://server:port/mp
 * http://server:port/mp/id/l1
 * http://server:port/mp/id/l1/l2
 *
 * Bsp.:
 *
 * http://localhost:8001/mp/mpdef
 *
 * mpdef ist die id des Messprogrammdokuments
 * bzw. der Messprogramm-Definition
 */
var get =  function(mps, req){

  var path  = req.params[0].split("/"),
      id    = path.shift(),
      ro;
  
  if(mps && mps[id]){
    var mp = mps[id],
        obj = mp.get(path);

    if(typeof obj === undefined){
      var msg = "found nothing";
      ro = {error:msg};
      req.log.error(ro, msg);
    }else{
      var msg = "obj sent back";
      ro  = {result:obj};
      req.log.info(ro, msg);
    }
  }else{
    var msg = "" + id + " not found";
    ro = {error:msg};
    req.log.error(ro, msg);
  }
  return ro;
};
exports.get = get;

/**
 * Set mp:
 *
 * PUT/POST
 * http://server:port/id
 *
 * Bsp.:
 *
 * http://localhost:8001/mpdef
 *
 * Messprogrammdokument
 * bzw. Messprogramm-Definition applizieren
 */
var setmd = function(req, res, next) {

  var path  = req.params[0].split("/"),
      obj   = req.body,
      ro;

  if(obj && path){
    var msg = "set mp doc";

    ro  = {ok:true};

    md.set(path, req.body, function(){
      res.send(ro);
      req.log.info(ro,msg);
    });

  }else{
    var msg = "no object";
    ro ={ok:false};
    req.log.info(ro,msg);
    res.send(ro);
  }
};
exports.setmd = setmd;
//    var db = nano("http://" +
//                  dp.get(database, server) + ":" +
//                  db.get(database, port)).use(db.get(database, name));
