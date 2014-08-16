var nano   = require("nano"),
    http   = require("http"),
    deflt  = require("./default");
/**
 * Die connection  sollte immer frisch sein,
 * da evtl. während der Messung der db-server
 * gewechselt werden muss. V.a. für Testzwecke
 * soll das Ganze aber auch ohne ```mp```
 * funktionieren.
 *
 *
 */
var dbcon = function(mp){
  var url;
  if(mp){
    var dbp = mp.param.get(["database"]);
    url = "http://" + dbp.server + ":" + dbp.port;
  }else{
    url = "http://" + deflt.database.server + ":" + deflt.database.port;
  }

  return nano(url);
};
exports.dbcon = dbcon

var doc = function(mp){
  var db;

  if(mp){
    var dbname  = mp.param.get(["database"]).name;

    db = dbcon(mp).use(dbname);
  }else{
    db =dbcon().use(deflt.database.name)
  }

  return db;
}
exports.doc = doc;

var task = function(mp){
  var par, ddb;

  if(mp){
    ddb  = mp.param.get(["database"]);
  }else{
    ddb = deflt.database;
  }
  return  {path: ddb.name   + "/_design/" +
           ddb.design     + "/_list/" +
           ddb.taskslist  + "/" +
           ddb.tasksview,
           method : "GET"
          };
};
exports.task = task;

var list = function(mp, task){
  var ddb,
      list = task.ListName,
      view = task.ViewName;

  if(mp){
    ddb  = mp.param.get(["database"]);
  }else{
    ddb = deflt.database;
  }

  return  {path: ddb.name   + "/_design/" +
           ddb.design     + "/_list/" +
           list           + "/" +
           view,
           method : "GET"
          };
}
exports.list = list;

var docinfo = function(mp, docid){
  var ddb;

  if(mp){
    ddb  = mp.param.get(["database"]);
  }else{
    ddb = deflt.database;
  }

  return  {path: ddb.name    + "/_design/" +
           ddb.design      + "/_show/" +
           ddb.docinfoshow +"/"+
           docid,
           method : "GET"
          };
}
exports.docinfo = docinfo;

var relay = function(mp){
  var ddb;

  if(mp){
    ddb  = mp.param.get(["relay"]);
  }else{
    ddb = deflt.relay;
  }

  return {hostname: ddb.server,
          port:     ddb.port,
          method:   "POST",
          headers: { 'Content-Type': 'application/json' }
         };
};
exports.relay = relay;