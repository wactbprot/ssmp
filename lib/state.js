var _        = require("underscore"),
    bunyan   = require("bunyan"),
    gen      = require("./gen"),
    ctrl     = require("./ctrl"),
    defaults = require("./defaults").all,
    log      = bunyan.createLogger({name: defaults.appname}),
    ds       = defaults.ctrlstr;
/**
 * observe is the container observer;
 * he looks on the state on the
 * global containers and reakts on
 * certain key word like:
 * - load
 * - run
 * - pause
 * - stop
 */
var observe = function(mp){
  setInterval(function(){
    // alle container durchlaufen
    _.each(mp.ctrl.get(), function (cmd, no){

      var state = gen.check(mp, no);
      log.info({container:no,
                state: state}, "container: " + no +
               " has state: " + state)


      if(cmd == "load"){
        gen.swalk(mp, no, ctrl.load);
      }

      if(cmd == "run"){
        gen.swalk(mp, no, ctrl.run);
      }

      if(cmd == "stop"){
        mp.ctrl.set([no], ds.readystr);
      }
    });
  }, mp.param.get(["system", "heartbeat"]));
};
exports.observe = observe;
