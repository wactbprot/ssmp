var nano   = require("nano"),
    http   = require("http"),
    deflt  = require("./default");
/**
 * Funktion liefert eine Datenbankverbindungsfunktion (dezeit nano).
 *
 * Diese Verbindung  sollte immer frisch sein,
 * da evtl. während der Messung der Datenbankserver
 * gewechselt werden muss. V.a. für Testzwecke
 * soll das Ganze aber auch ohne ```mp```
 * funktionieren.
 *
 * @param {Object} mp Messprog.-Objekt
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
  return  {hostname:ddb.server,
           port: ddb.port,
           path: "/" + ddb.name   + "/_design/" +
           ddb.design     + "/_list/" +
           ddb.taskslist  + "/" +
           ddb.tasksview,
           method : "POST"
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

  return  { hostname:ddb.server,
            port: ddb.port,
            path: "/"
                + ddb.name
                +'/_design/'
                + ddb.design
                +'/_list/'
                + list
                + '/'
                + view,
            method : 'GET',
            headers: {'Content-Type': 'application/json; charset=utf-8' }
          };
}
exports.list = list;

var wrtdoc = function(mp, id){
  var ddb;

  if(mp){
    ddb  = mp.param.get(["database"]);
  }else{
    ddb = deflt.database;
  }

  return  { hostname:ddb.server,
            port: ddb.port,
            path: "/"
                + ddb.name
                +'/'
                + id,
            method : 'PUT',
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
          };
}
exports.wrtdoc = wrtdoc;

var rddoc = function(mp, id){
  var ddb;

  if(mp){
    ddb  = mp.param.get(["database"]);
  }else{
    ddb = deflt.database;
  }

  return  { hostname:ddb.server,
            port: ddb.port,
            path: "/"
                + ddb.name
                +'/'
                + id,
            method : 'GET',
            headers: {'Content-Type': 'application/json; charset=utf-8' }
          };
}
exports.rddoc = rddoc;

var docinfo = function(mp, docid){
  var ddb;

  if(mp){
    ddb  = mp.param.get(["database"]);
  }else{
    ddb = deflt.database;
  }

  return  {  hostname:ddb.server,
             port: ddb.port,
             path:  "/"
                 + ddb.name
                 + "/_design/"
                 + ddb.design
                 + "/_show/"
                 + ddb.docinfoshow
                 +"/"
                 + docid,
             method : "GET",
             headers: {'Content-Type': 'application/json; charset=utf-8' }
          };
}
exports.docinfo = docinfo;

/**
 * Funktion liefert das Options-Objekt,
 * das für Verbindungen mit dem  _node-relay_-server
 * benutzt wir.
 *
 * Der Eintrag ```agent: false``` ist nötig um
 * einen
 * ```
 * ECONNRESET
 * ...
 * socket hang up
 * ```
 * Fehler zu vermeiden. Bei der Benutzung
 * des _agent_ wird per default
 * die Anzahl der sockets auf 5 beschränkt.
 *
 * @param {Object} mp Messprog.-Objekt
 */

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
          agent: false,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
         };
};
exports.relay = relay;