var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    deflt    = require("./default"),
    gen      = require("./generic"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

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

module.exports = function(mps, req, cb){
  var msg, ro,
      id     = req.params.id,
      cdid   = req.params.cdid,
      cmd    = req.body;

  if(id            &&
     mps[id]       &&
     mps[id].id    &&
     cmd           &&
     cdid){

    if(cmd === "load"){
      var mp   = mps[id],
          opts = net.docinfo(mp, cdid);
      log.info({ok: true}, "try to add id: " + cdid   );

      net.dbcon(mp).relax(opts, function(err, info){
        if(_.isObject(info)){
          mp.id.set([cdid], info, cb)
        }
        if(err){
          log.error({error:"request failed"}, err)
        }
      });
    }
  }else{
    ro = {error: "not a valid path"};
    log.error(ro, "mp does not exist or no command given");
    cb(ro);
  }
};