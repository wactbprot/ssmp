var nano = require("nano");

/**
 * Die connection  sollte immer frisch sein,
 * da evtl während der Messung der db-server
 * gewechselt werden muss
 *
 * co ... connection object
 */
exports.co = function(mp){

  var dbp = mp.param.get(["database"]),
      url = "http://" + dbp.server + ":" + dbp.port;

  return nano(url).use( dbp.name )
}