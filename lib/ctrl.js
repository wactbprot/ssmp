var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require('bunyan'),
    clone    = require("clone"),
    cdb      = require("./cdb"),
    gen      = require("./gen"),
    defaults = require("./defaults"),
    worker   = require("./worker"),
    log      = bunyan.createLogger({name: name});

/**
 * load() ersetzt die TaskNamen in den
 * Rezepten mit den eigentlichen Objekten
 */
var load  = function(mp, path){
  var state    = mp.state.get(path);
  if(state === "ready"){
    var taskname,
        co       = cdb.co(mp),
        dbp      = mp.param.get(["database"]),
        task     = mp.recipe.get(path);
    // load ist auch
    // reload; in diesem Fall
    // ist task ein schon ein object

    if(_.isObject(task) &&
       _.isString(task.TaskName)){
      taskname = task.TaskName;
    }

    if(_.isString(task)){
      taskname = task;
    }

    log.info({ok:true}, "try loading " + taskname)

    if(taskname){
      co.view(dbp.design, dbp.tasksview, {key:taskname},
              function(err, body){
                // check returned task with care
                if(body.rows          &&
                   body.rows[0]       &&
                   body.rows[0].value &&
                   typeof body.rows[0].value === "object"){

                  var task = body.rows[0].value;
                  mp.recipe.set(path, task, function(){
                    mp.state.set(path,"executed", function(){
                      log.info(task, "loaded and replaced")
                    });
                  });

                }else{ // task ok
                  mp.state.set(path,"missing", function(){
                    log.error({error:"not_found"}, "no task called " + taskname)
                  });
                } // no task
              }); // view: get tasks by name
    }else{ // task ist string
      log.error({error:"not_found"}, "receive taskname: " + taskname)
    }
  }
};

var run  = function(mp, path){
  var state    = mp.state.get(path);
  if(state === "ready"){
    var task     = mp.recipe.get(path);
    if(_.isObject(task) &&
       task.Action){
      var exec = task.Action;
      mp.state.set(path, "running", function(){
        worker[exec](task);
      });
    }
  }
};



/**
 * --*-- ini --*--
 *
 * POST
 * http://server:port/mpid/mp
 *
 * Bsp.:
 *
 * http://localhost:8001/mpid/mp
 *
 * ```mpid``` ist die ```id``` des Messprogrammdokuments
 * bzw. der Messprogrammdefinition im POST-Body
 */
var ini = function(mps, req, cb){
  var id    = req.params.id,
      docmp = req.body;

  req.log.info(docmp, "Mp definition received");

  if(typeof docmp === "string"){
    docmp = JSON.parse(docmp);
    req.log.info(docmp, "parsed from string");
  }

  var doc =  docmp.Mp, ro;

  if(mps.hasOwnProperty(id)){
    var msg =  "already initialized";
    ro      = {error: msg};
    req.log.error(ro, msg);

  }else{
    var element   = gen.lift(doc.Container, "Element");
    var recipe    = gen.lift(doc.Container, "Recipe");
    var state     = clone(recipe);
    var title     = gen.lift(doc.Container, "Title");
    var ctl       = gen.lift(doc.Container, "Ctrl");
    var rtimerid  = clone(ctl);

    mps[id]           = {};
    mps[id].element   = gen.mod(element);
    mps[id].recipe    = gen.mod(recipe);
    mps[id].state     = gen.mod(state);
    mps[id].title     = gen.mod(title);
    mps[id].ctrl      = gen.mod(ctl);
    mps[id].id        = gen.mod();
    mps[id].param     = gen.mod(defaults.all);

    mps[id].rtimerid  = gen.mod(rtimerid);
    // initialize deviated structures ...
    // ... with 0 ...
    mps[id].rtimerid.ini(0, function(){
      // ... and "ready"
      mps[id].state.ini("ready", cb);
    })
  }
}
exports.ini = ini;

/**
 * observe is the container observer;
 * he looks on the state on the
 * global containers and reakts on
 * certain key word like:
 * - load
 * - run
 * - pause
 * - stop
 */
var observe = function(mp){
  setInterval(function(){
    // alle container durchlaufen
    _.each(mp.ctrl.get(), function (cmd, no){

      console.log(check(mp, no));

      if(cmd == "load"){
        walk(mp, no, load);
      }

      if(cmd == "run"){
        walk(mp, no, run);
      }

      if(cmd == "stop"){
        mp.ctrl.set([no], "ready");
      }
    });
  }, mp.param.get(["system", "heartbeat"]));
};
exports.observe = observe;

/**
 * checks the over all state of a container
 */

var check = function(mp, no){
  var inistr = "unchecked",
      wstr   = "working",
      gs     = inistr, // global state
      cs     = inistr, // current state
      ret    = inistr,
      state  = mp.state.get([no]),
      seqN   = state.length;

  for(var seq = 0; seq < seqN; seq++){
    var seqElem = state[seq],
        parN    = seqElem.length;
    for(var par = 0; par < parN; par++){
      cs = mp.state.get([no, seq, par]);
      if(gs === inistr){
        gs = cs;
      }
      if(cs !== gs){
        ret = wstr;
        break;
      }
    }
    if(ret !== inistr){
      break;
    }
  }
  if(ret === inistr){
    ret = gs;
  }
  return ret;
};

/**
 * walkes over the recipe structure
 * and executes exec(mp, path)
 */
var walk = function(mp, no, exec){
  if(_.isFunction(exec)){
    var state = mp.state.get([no]),
        seqN  = state.length;

    for(var seq = 0; seq < seqN; seq++){
      var seqElem = state[seq],
          parN    = seqElem.length;
      if(_.contains(seqElem, "ready")){
        for(var par = 0; par < parN; par++){
          exec(mp, [no, seq, par]);
        }
        break;
      }
    }
  }
};