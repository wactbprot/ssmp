var _        = require("underscore"),
    bunyan   = require("bunyan"),
    gen      = require("./gen"),
    ctrl     = require("./ctrl"),
    defaults = require("./defaults").all,
    log      = bunyan.createLogger({name: defaults.appname}),
    ds       = defaults.statstr;
/**
 * observe is the container observer;
 * he looks on the state on the
 * global containers and reakts on
 * certain key word like:
 * - load
 * - run
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
      //if(state === ds.exec)

      if(cmd == "load"){
        gen.walk(mp, no, ctrl.load);
      }

      if(cmd == "run"){
        gen.walk(mp, no, ctrl.run);
      }

      if(cmd == "stop"){
        mp.ctrl.set([no], ds.ready);
      }
    });
  }, mp.param.get(["system", "heartbeat"]));
};
exports.observe = observe;
