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
    clone    = require("clone"),
    deflt    = require("./default"),
    net      = require("./net"),
    store    = require("./store"),
    gen      = require("./generic"),
    compare  = require("./compare"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

var wait = function(mp, task, path, cb){
  if(task.Value          &&
     task.Value.WaitTime){

    setTimeout(function(){
      cb("ok");
    }, parseInt(task.Value.WaitTime,10))
  }else{
    cb("error")
  }
};

var noderelay = function(mp, task, path, cb){

  var con = net.relay(mp),
      req = http.request(con, function(res) {
              res.setEncoding("utf8");
              res.on("data", function (data) {
                store.receive(mp, task, path, data, cb);
                log.info({ok: true}, "receive data from " + task.TaskName + " request")
              });
              res.on("end", function(){
                log.info({ok: true}, "ready with " + task.TaskName)
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

var addElement = function(mp, task, path, cb){
  if(task.Value &&
     task.Key){

    // alles nach exchange,
    // unter elems nur noch path zu
    // exchange
    var prob,
        exchObj   = {},
        key       = task.Key,
        val       = task.Value;

    if(task.CuCo){
      key = deflt.cucoStr + "-" + key;
    }
    mp.exchange.set(key.split("."), val, function(){
      log.info({ok:true}, "wrote " + key + " to Exchange")
      cb("ok");
    });
  }else{
    cb("error");
    log.error({error:"not a valid task"}, "missing  Key or Value")
  }
};

var readElement = function(mp, task, path, cb){
  if(task.Key){

    var  key       = task.Key;
    if(task.CuCo){
     key = deflt.cucoStr + "-" + key;
    }
    var data =  mp.exchange.get(key.split("."));
    if(_.isUndefined(data)){
      cb("error");
      log.error({error:"struct missing"}, "nothing below " + key)
    }else{
      if(data.Ready){
        var o = {};
        for(var k in data){
          if(_.isObject(data[k]) &&
           ! _.isUndefined(data[k].value) &&
             data[k].save){
            if(data[k].type === "number"){
              o[k] = parseFloat(data[k].value);
            }
          }
        }
        log.info({ok:true}, "try storing data")
        store.calldoc(mp, task, {Result:o}, cb);
      }else{
        cb("again");
      }
    }
  }else{
   cb("error");
   log.error({error:"not a valid task"}, "missing  key to read from")
 }
};

var select = function(mp, task, path, cb){

  if(task.Value &&
     task.Value.RecipeClass){
    var rclass = task.Value.RecipeClass,
        rcps   = mp.recipes.get([]),
        take   = false,
        pos    = clone(path).shift();

    for(var i = 0; i < rcps.length; i++){
      var rcp = rcps[i];
      if(rcp.RecipeClass === rclass){
        log.info({ok:true}, "found recipe class")
        var conds = rcp.Conditions;
        take  = true;
        for(var j = 0; j < conds.length; j++){
          var cond = conds[j];
          if(cond.ExchangePath &&
             cond.Value &&
             cond.Methode){
            var exchval = mp.exchange.get(cond.ExchangePath),
                condval = cond.Value;

            if(_.isUndefined(exchval)){
              take = false;
              break;
            }else{
              take = take && compare[cond.Methode](exchval, condval);
            }
          }
        }

        if(take){
          log.info({ok:true}, "found matching recipe")
          cb("ok");
          clearInterval(mp.timerid.get([pos]));
          mp.timerid.set([pos], 0, function(){
            mp.definition.del([pos], function(){
                mp.recipe.del([pos], function(){
                  log.info({ok:true}, "sync def and state: " + pos);
                  mp.definition.set([pos], rcp.Definition, function(){
                    gen.setstate(mp, pos, rcp.Definition, ctrlstr.ready, function(){
                      mp.ctrl.set([pos], "load;" + mp.ctrl.get([pos]), function(){
                        log.info({ok:true}, "load matching recipe")
                      });
                    });
                  });
                });
            });
          });
          break;
        }
      }
    } // for
    if(!take){
      log.error({error:"no recipe"}, "no recipe matches the conditions");
      cb("error")
    }
  }else{
    cb("error");
    log.error({error:"recipe class missing"}, "don't know which RecipeClass to look for")
  }
};

var getList = function(mp, task, path, cb){
  var opts     = net.list(mp, task);

  if(task.Params){
    opts.params = task.Params;
  }

  net.dbcon(mp).relax(opts, function(err, data){
    if(_.isObject(data)){ // task ok
      log.info({ok: true}, "try to receive data from /"
                         + task.ListName
                         + "/"
                         + task.ViewName)
      store.receive(mp, task, path, data, cb);
    }
    if(err){
      cb("error")
      log.error({error:"request failed"}, err)
    }
  }); // view: get tasks by name

}


exports.VXI11        = noderelay;
exports.TCP          = noderelay;
exports.UDP          = noderelay;

exports.wait         = wait;
exports.addElement   = addElement;
exports.readElement  = readElement;
exports.select       = select;
exports.getList      = getList;