var nano = require("nano"),
    http = require("http");

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

exports.relayreq = function(con, df, cb){
  var req = http.request(con, function(res) {
              res.setEncoding("utf8");
              res.on("data", function (data) {
                df(data)
              });
              res.on("end", function(){
                cb("ok")
              });
              res.on("error", function(e){
                cb("error")
              });
            });

  req.on("error", function(e) {
    console.log(e)
  });

  return req;
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
