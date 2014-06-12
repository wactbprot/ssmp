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
    receive  = require("./receive"),
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
                receive(mp, task, path, data);
                log.info({ok: true}, "receive data from " + task.TaskName + " request")
              });
              res.on("end", function(){
                cb("ok");
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
          var fbv = entr.type ? deflt.fallbackvalues[entr.type] : "";
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

var rmElement = function(mp, task, path, cb){
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
                  mp.definition.set([pos], rcp.Recipe, function(){
                    gen.setstate(mp, pos, rcp.Recipe, ctrlstr.ready, function(){
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
      log.info({ok:true}, "no matching recipe found");
      cb("error")
    }
  }else{
    cb("error");
    log.error({error:"no RecipeClass given"}, "don't know which RecipeClass to look for")
  }
};

exports.VXI11      = noderelay;
exports.TCP        = noderelay;
exports.wait       = wait;
exports.addElement = addElement;
exports.rmElement  = rmElement;
exports.select     = select;