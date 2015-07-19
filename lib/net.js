var _   = require("underscore")
  , dt  = require("./default")
  , qs  = require('querystring');


/**
 * Die Funktion ```relay()```
 * liefert das Options-Objekt,
 * das für Verbindungen mit dem  _relayServer_
 * benutzt wird.
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
 * @method relay
 * @return ObjectExpression
 */
var relay = function(){
  var ddb = dt.relay;
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
 * @method task
 * @return ObjectExpression
 */
var task = function(strdata){
  var ddb = dt.database;

    var ro = {hostname:ddb.server,
              port: ddb.port,
              path: "/"
                  + ddb.name
                  + "/_design/"
                  + ddb.design
                  + "/_list/"
                  + ddb.taskslist
                  + "/"
                  + ddb.tasksview,
              method : "POST",
              headers: {
                'Content-Type': 'application/json'
              }
             };
  if(strdata && _.isString(strdata)){
    ro.headers['Content-Length'] = Buffer.byteLength(strdata);
  }
  return ro;
  };
exports.task = task;

/**
 * Die Funktion ```task()```
 * liefert das Verbindungsobjekt für die
 * list:
 * ```
 * POST: _list/listname/viewname
 * ```
 * @method checkdb
 * @return ObjectExpression
 */
var checkdb = function(){
  var ddb = dt.database;
  return  {hostname:ddb.server,
           port: ddb.port,
           path: "/" + ddb.name,
           method : "GET"
          };
};
exports.checkdb = checkdb;




/**
 * Die Funktion ```container()```
 * liefert das Verbindungsobjekt für die
 * :
 * ```
 * POST: _list/listname/viewname
 * ```
 * @method container
 * @param {} cont
 * @return ObjectExpression
 */
var container = function(cont){
  var ddb = dt.database;
  return  {hostname:ddb.server,
           port: ddb.port,
           path: "/"
               + ddb.name
               + "/_design/"
               + ddb.design
               + "/_list/"
               + ddb.containerlist
               + "/"
               + ddb.containerview,
           method : "POST"
          };
};
exports.container = container;

/**
 * Die Funktion ```list()```
 * liefert das Verbindungsobjekt für die
 * list:
 * ```
 * GET: _list/listname/viewname?key=value
 * ```
 * @method list
 * @param {Object} task aufrufende Task
 * @return con
 */
var list = function(task){
  var parstr = "",
      ddb    = dt.database,
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
 * @method wrtdoc
 * @param {String} id KD-id
 * @return ObjectExpression
 */
var wrtdoc = function(id){
  var ddb = dt.database;
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
 * @method rddoc
 * @param {String} id KD-id
 * @return ObjectExpression
 */
var rddoc = function(id){
  var ddb = dt.database;
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
 * @method docinfo
 * @param {String} id KD-id
 * @return ObjectExpression
 */
var docinfo = function(id){
  var ddb = dt.database;
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
