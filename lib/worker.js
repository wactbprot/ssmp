/**
 *
 * Die ```worker``` arbeiten die ```tasks``` ab.
 *
 * @author wactbprot (thsteinbock@web.de)
 */
var ctr = require("./ctr.js");

/**
 * Auch hier zunächst ein demo worker,
 * nach dessen Muster alle Weiteren
 * funktionieren sollten
 *
 *
 * @param pos Object die Position der Task im Rezept
 * @param cbfn die callback-Funktion
 */

var demoWorker = function(pos, cbFn){
    ctr.setRunning(pos);
    //-----------------//
    // place code here //
    //---------------- //
    ctr.setExecuted(pos);
};
exports.demoWorker = demoWorker;
