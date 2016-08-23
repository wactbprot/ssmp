var _      = require("underscore")
  , broker = require("sc-broker")
  , qs     = require('querystring')
  , conf   = require("./conf")
  , mem    = broker.createClient({port: conf.mem.port});

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
 */
var relay = function(cb){
  mem.get(["defaults"], function(err, d){
    if(!err){
      cb(null,{hostname: d.relay.server,
               port:     d.relay.port,
               method:   "POST",
               agent: false,
               headers: { 'Content-Type': 'application/json; charset=utf-8' }
              });
    }else{
      cb(err);
    }
  }); // defaults
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
var task = function(strdata, cb){
  mem.get(["defaults"], function(err, d){
    if(!err){
      var ddb = conf.database;

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
      cb(null, ro);
    }else{
      cb(err);
    }
  }); // defaults
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
var checkdb = function(cb){
  mem.get(["defaults"], function(err, d){
    if(!err){
      var ddb = conf.database;
      cb(null, {hostname:ddb.server,
                port: ddb.port,
                path: "/" + ddb.name,
                method : "GET"
               });
    }else{
      cb(err);
    }
  }); // defaults
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
var container = function(cont, cb){
  mem.get(["defaults"], function(err, d){
    if(!err){
      var ddb = conf.database;
      cb(null, {hostname: ddb.server,
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
               });
    }else{
      cb(err);
    }
  }); // defaults
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
var list = function(task, cb){
  mem.get(["defaults"], function(err, d){
    if(!err){
      var parstr = ""
        , ddb    = conf.database
        , list   = task.ListName
        , view   = task.ViewName
        , con    = { hostname:ddb.server
                   , port: ddb.port
                   ,  path: "/"
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
          parstr = qs.stringify(task.Param);
        }
        con.path = con.path + "?" + parstr;
      }

      cb(null, con);
    }else{
      cb(err);
    }
  }); // defaults
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
var wrtdoc = function(id, cb){
  mem.get(["defaults"], function(err, d){
    if(!err){
      var ddb = conf.database;
      cb(null, { hostname:ddb.server,
                 port: ddb.port,
                 path: "/"
                     + ddb.name
                     +'/'
                     + id,
                 method : 'PUT',
                 headers: { 'Content-Type': 'application/json; charset=utf-8' }
               });
    }else{
      cb(err);
    }
  });
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
var rddoc = function(id, cb){
  mem.get(["defaults"], function(err, d){
    if(!err){
      var ddb = conf.database;
      cb(null, { hostname:ddb.server,
                 port: ddb.port,
                 path: "/"
                     + ddb.name
                     +'/'
                     + id,
                 method : 'GET',
                 headers: {'Content-Type': 'application/json; charset=utf-8' }
               });
    }else{
      cb(err);
    }
  });
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
var docinfo = function(id, cb){
  mem.get(["defaults"], function(err, d){
    if(!err){
      var ddb = conf.database;
      cb(null, {  hostname:ddb.server,
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
               });
    }else{
      cb(err);
    }
  });
}
exports.docinfo = docinfo;
