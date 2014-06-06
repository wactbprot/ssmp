/**
 * Die ```worker``` arbeiten die ```tasks``` ab.
 *
 * Die taskks sind von der Funktion
 * ```run()``` schon auf object getestet.
 *
 * @author wactbprot (thsteinbock@web.de)
 */
var _        = require("underscore"),
    bunyan   = require("bunyan"),
    http     = require("http"),
    d        = require("./default"),
    net      = require("./net"),
    receive  = require("./receive"),
    log      = bunyan.createLogger({name: d.appname});


var wait = function(mp, task, cb){
  if(task.Value          &&
     task.Value.WaitTime){

    setTimeout(function(){
      cb("ok");
    }, parseInt(task.Value.WaitTime,10))
  }else{
    cb("error")
  }
};

var noderelay = function(mp, task, cb){

  var con = net.relay(mp),
      req = http.request(con, function(res) {
              res.setEncoding("utf8");
              res.on("data", function (data) {
                receive(mp, task, data);
                log.info({ok:true}, "receive data from " + task.TaskName + " request")
              });
              res.on("end", function(){
                cb("ok");
                log.info({ok:true}, "ready with " + task.TaskName)
              });
              res.on("error", function(e){
                cb("error");
                log.error({error:e}, "response failed")
              });
            });

  req.on("error", function(e) {
    cb("error");
    log.error({error:e}, "request failed")
  });

  req.write(JSON.stringify(task));
  req.end();
};

var addElement = function(mp, task, cb){
  if(task.Value &&
     task.TaskName &&
     task.Key &&
     task.Container){
    // value nur in exchange
    // rest nur nach elems
    var prob,
        exchObj   = {},
        key       = task.Key,
        container = task.Container,
        val       = task.Value;

    exchObj.Id = task.Id;

    for(prob in val){
      var entr = val[prob];
      if(_.isObject(entr)){
        if( entr.exchange){
          var fbv = entr.type ? d.fallbackvalues[entr.type] : "";
          exchObj[prob] = entr.value || fbv;
        }
      };
    }
    mp.exchange.set([key], exchObj, function(){
      log.info({ok:true}, "wrote " + key + " to Exchange")
      mp.element.set([container, key], val, function(){
        log.info({ok:true}, "wrote " + key + " to Container" + container)
        cb("ok");
      });
    });
  }else{
    cb("error");
    log.error({error:"not a valid task"}, "missing Container, Taskname, Value or Key")
  }
};

var rmElement = function(mp, task, cb){
  if(task.Key){
    var key       = task.Key,
        container = task.Container || false;

    mp.exchange.del([key], function(){
      log.info({ok:true}, "deleted " + key + " from Exchange")
      if(container){
        mp.element.set([container, key], function(){
          log.info({ok:true}, "wrote " + key + " to Container" + container)
          cb("ok");
        });
      }else{
        cb("ok");
      }
    });
  }else{
    cb("error");
    log.error({error:"no key given"}, "don't know which entry to delete")
  }
};
exports.VXI11      = noderelay;
exports.TCP        = noderelay;
exports.wait       = wait;
exports.addElement = addElement;
exports.rmElement  = rmElement;