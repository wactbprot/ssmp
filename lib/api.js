var dp     = require("./dp").dp,
    md     = require("./md").md,
    _      = require("underscore");
/**
 * Get mp-status:
 *
 * GET
 * http://server:port/
 *
 * Bsp.:
 *
 * http://localhost:8001/
 */
var status = function(req, res, next) {
  var msg = "ssmp up & running";
  res.send({message: msg});
  req.log.info({ok: true}, msg);

};
exports.status = status;

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
var getmd = function(req, res, next) {

  var path  = req.params[0].split("/"),
      obj   = md.get(path);

   if(obj === undefined){
     var msg = "found nothing",
         ro = {error:msg};

     req.log.error(ro, msg);
     res.send(ro);
   }else{
     var msg = "object send",
         ro  = {ok: true};
     req.log.info(ro, msg);
     // ohne result kann ein Wert
     // wie false
     // nicht zurückgegeben werden
     res.send({result:obj});
   }
};
exports.getmd = getmd;

/**
 * Set mp:
 *
 * POST
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
      obj   = req.body;

  if(obj && path){
    var msg = "set mp doc",
        ro  = {ok:true};
    md.set(path, req.body, function(){
      res.send(ro);
      req.log.info(ro,msg);
    });
  }else{
    var msg = "no object ",
        ro ={ok:false};
    res.send(ro);
    req.log.info(ro,msg);
  }
};
exports.setmd = setmd;


/**
 * Get param:
 *
 * GET
 * http://server:port/param/group
 *
 * Bsp.:
 *
 * http://localhost:8001/param/database
 *
 * Parametersätze abfragen
 *
 */
var getparam = function(req, res, next) {

  var group = req.params.group;
  var obj   = dp.getgroup(group);

  if(obj && _.isObject(obj)){
    var msg = "object " + group + " send",
        ro  = {ok: true};
    req.log.info(ro, msg);
    res.send(obj);
  }else{
    var msg = "mpdoc " + group + " not found",
    ro = {error:msg};

    req.log.error(ro, msg);
    res.send(ro);
  }
};
exports.getparam = getparam;

/**
 * Set param:
 *
 * POST
 * http://server:port/param/group
 *
 * Bsp.:
 *
 * http://localhost:8001/param/database
 *
 * Parametersatz applizieren/ersetzten
 *
 */
var setparam = function(req, res, next) {
  var group = req.params.group,
      obj   = req.body,
      msg   = "set group " + group,
      ro    = {ok:true};

  if(_.isObject(obj)){
    dp.setgroup(group, obj, function(){
      res.send(ro);
      req.log.info(ro,msg);
      next();
    });
  }
};
exports.setparam = setparam;

//    var db = nano("http://" +
//                  dp.get(database, server) + ":" +
//                  db.get(database, port)).use(db.get(database, name));
