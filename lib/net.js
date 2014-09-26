var deflt  = require("./default"),
    qs     = require('querystring');
/**
 * Liefert Datenbankverbindungsparameter.
 *
 * @param {Object} mp Messprog.-Objekt
 */

var param = function(mp, of){

 if(mp){
    return  mp.param.get([of]);
  }else{
    return deflt.database;
  }
}


/**
 * Die Funktion ```relay()```
 * liefert das Options-Objekt,
 * das für Verbindungen mit dem  _relayServer_
 * benutzt wird.
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
 * @param {Object} mp MP-Objekt
 */

var relay = function(mp){
  var ddb = param(mp, "relay");
  return {hostname: ddb.server,
          port:     ddb.port,
          method:   "POST",
          agent: false,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
         };
};
exports.relay = relay;

/**
 * Die Funktion ```task()```
 * liefert das Verbindungsobjekt für die
 * list:
 * ```
 * POST: _list/listname/viewname
 * ```
 *
 * @param {Object} mp Messprog.-Objekt
 */

var task = function(mp){
  var ddb = param(mp, "database");
  return  {hostname:ddb.server,
           port: ddb.port,
           path: "/"
               + ddb.name
               + "/_design/"
               + ddb.design
               + "/_list/"
               + ddb.taskslist
               + "/"
               + ddb.tasksview,
           method : "POST"
          };
};
exports.task = task;

/**
 * Die Funktion ```list()```
 * liefert das Verbindungsobjekt für die
 * list:
 * ```
 * GET: _list/listname/viewname?key=value
 * ```
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task aufrufende Task
 */
var list = function(mp, task){
  var parstr = "",
      ddb    = param(mp, "database"),
      list   = task.ListName,
      view   = task.ViewName;

  var con = { hostname:ddb.server,
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

  if(task.Param){
    if(task.Param.keys){
      parstr = "keys=" + JSON.stringify(task.Param.keys);
    }else{
      parstr = qs.stringify(task.Param)
    }
    con.path = con.path + "?" + parstr
  }

  return con;
}
exports.list = list;

/**
 * Die Funktion ```wrtdoc()```
 * liefert das Verbindungsobjekt für die
 * url:
 * ```
 * PUT: db/id
 * ```
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {String} id KD-id
 */

var wrtdoc = function(mp, id){
  var ddb = param(mp, "database");
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


/**
 * Die Funktion ```rddoc()```
 * liefert das Verbindungsobjekt für die
 * url:
 * ```
 * GET: db/id
 * ```
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {String} id KD-id
 */
var rddoc = function(mp, id){
  var ddb = param(mp, "database");
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

/**
 * Die Funktion ```docinfo()```
 * liefert das Verbindungsobjekt für die
 * show:
 * ```
 * _show/docinfo/id
 * ```
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {String} id KD-id
 */

var docinfo = function(mp, id){
  var ddb = param(mp, "database");
  return  {  hostname:ddb.server,
             port: ddb.port,
             path:  "/"
                 + ddb.name
                 + "/_design/"
                 + ddb.design
                 + "/_show/"
                 + ddb.docinfoshow
                 +"/"
                 + id,
             method : "GET",
             headers: {'Content-Type': 'application/json; charset=utf-8' }
          };
}
exports.docinfo = docinfo;
