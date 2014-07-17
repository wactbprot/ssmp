var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require("bunyan"),
    deflt    = require("./default"),
    utils    = require("./oputils"),
    gen      = require("./generic"),
    net      = require("./net"),
    simjs    = require("./simdef"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * --*-- ini --*--
 *
 * ```mpid``` ist die ```id``` des Messprogrammdokuments
 * bzw. der Messprogrammdefinition im POST-Body
 */
var ini = function(mps, req, cb){
  var id    = req.params.id,
      rb    = req.body,
      sim   = "sim";

  mps[id]  = {};
  var mp   = mps[id];
  mp.param = gen.mod(deflt);

  req.log.info({ok: true}, "Mp id received");

  if(id !== sim && typeof rb === "string" && rb === ctrlstr.load){
    if(mps.hasOwnProperty(id)){
      log.info({ok:true},"already initialized, try again")
    }
    net.doc(mp).get(id, function(error, doc){
      if(error){
        log.error({error:error}, "failed to load mp definition");
      }
      if(doc){
        log.info({ok:true}, "try to build mp");
        utils.buildup(mp, doc, cb);
      }
    });
  }

  if(typeof rb === "object"){
    log.info({ok:true},"received mp definition by post request")
    utils.buildup(mp, rb, cb);
  }
  if(id === sim){
    log.info({ok:true},"request the md simulation")
    utils.buildup(mp, simjs, cb);
  }
}
exports.ini = ini;
