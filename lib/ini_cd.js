var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    deflt    = require("./default"),
    request  = require("./request"),
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

      log.info({ok: true}, "try to add id: " + cdid);

      var con = net.docinfo(mps[id], cdid);
      request.exec(mps[id],  false, false, con, false, cdid ,
                   function(res){
                     if(res.ok){
                       log.info({ok: true}, "doc added see mpid/id/"+ cdid);
                     }else{
                       log.error({error:"error adding doc"}, "error adding doc: "+ cdid);
                     }
                     if(_.isFunction(cb)){
                       cb(res);
                     }
                   })
    }
  }else{
    ro = {error: "not a valid path"};
    log.error(ro, "mp does not exist or no command given");
    cb(ro);
  }
};