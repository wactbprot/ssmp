var nano = require("nano");

/**
 * Die connection  sollte immer frisch sein,
 * da evtl. während der Messung der db-server
 * gewechselt werden muss.
 *
 * co ... connection object
 */
exports.dbcon = function(mp){

  var dbp = mp.param.get(["database"]),
      url = "http://" + dbp.server + ":" + dbp.port;

  return nano(url);
}

exports.taskopts = function(mp){
 
  var dbp  = mp.param.get(["database"]);
  return  {
    path: dbp.name   + "/_design/" +
      dbp.design     + "/_list/" +
      dbp.taskslist  + "/" +
      dbp.tasksview,
        method : "GET"
  };
}