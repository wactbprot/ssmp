var nano = require("nano"),
    http = require("http");

/**
 * Die connection  sollte immer frisch sein,
 * da evtl. während der Messung der db-server
 * gewechselt werden muss.
 *
 * co ... connection object
 */
var dbcon = function(mp){

  var dbp = mp.param.get(["database"]),
      url = "http://" + dbp.server + ":" + dbp.port;

  return nano(url);
};
exports.dbcon = dbcon

var doc = function(mp){
  var dbname  = mp.param.get(["database"]).name,
      db      = dbcon(mp).use(dbname);
  return db;

}
exports.doc = doc;

exports.task = function(mp){
  var dbp  = mp.param.get(["database"]);
  return  {
    path: dbp.name   + "/_design/" +
      dbp.design     + "/_list/" +
      dbp.taskslist  + "/" +
      dbp.tasksview,
        method : "GET"
  };
};

exports.docinfo = function(mp, docid){
  var dbp  = mp.param.get(["database"]);
  return  {
    path: dbp.name    + "/_design/" +
      dbp.design      + "/_show/" +
      dbp.docinfoshow +"/"+
      docid,
    method : "GET"
  };
}

exports.relay = function(mp){
  var dr  = mp.param.get(["relay"]),
      con = {
        hostname: dr.server,
        port:     dr.port,
        method:   "POST",
        headers: { 'Content-Type': 'application/json' }
      };

  return con;
};
