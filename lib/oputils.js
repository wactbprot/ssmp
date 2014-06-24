var _        = require("underscore"),
    bunyan   = require("bunyan"),
    deflt    = require("./default"),
    gen      = require("./generic"),
    net      = require("./net"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;


var repltask = function(task, token, value){
   console.log(token)
   console.log(value)
  var strtask = JSON.stringify(task),
      patt    = new RegExp( token ,"g");

  if(Object.prototype.toString.call( value ) === '[object Array]'){
    strtask = strtask.replace(patt, JSON.stringify(value))
              .replace(/\"\[/g, "\[")
              .replace(/\]\"/g, "\]")
  }else{
    strtask  = strtask.replace(patt, value);
  }
  strtask  = strtask.replace(/\n/g, "\\n");
  strtask  = strtask.replace(/\r/g, "\\r");

  return JSON.parse(strtask);
}
exports.repltask = repltask;


var fetchtask = function(mp, path){

  var task     = mp.recipe.get(path),
      opts     = net.task(mp),
      taskname =  task.TaskName;

  opts.body    = task; // immer alles mitschicken
  opts.method  = "POST";

  log.info({ok:true}, "try loading " + taskname)
  net.dbcon(mp).relax(opts, function(err, task){
    if(_.isObject(task)){ // task ok
      if(task.error){
        log.error(task,"can not load task")
      }else{
        mp.recipe.set(path, task, function(){
          mp.state.set(path, ctrlstr.exec, function(){
            log.info(task, "loaded and replaced")
          });
        });
      }
       }else{ // task not ok
         mp.state.set(path, ctrlstr.missing, function(){
           log.error({error:"not_found"},
                     "no task called " + taskname)
         });
       } // no task
    if(err){
      log.error({error:"request failed"}, err)
       }
  }); // view: get tasks by name
}
exports.fetchtask = fetchtask;

var build = {};

build.down = function(mp){
  var doc   = {};
  doc._id   = mp.id
  doc._rev  = mp.rev
  doc.Date  = mp.date.get([]);
  doc.Name  = mp.name.get([]);
  doc.title = mp.title.get([]);

  return doc;
}



build.up = function(mp, docmp, cb){
  var doc  = docmp.Mp,
      dc   = doc.Container,
      nc   = dc.length;

  mp.rev        = docmp._rev;
  mp.id         = docmp._id;
  mp.standard   = doc.Standard;

  build.base(mp, doc, function(){
    for(var i = 0; i < nc; i++){
      mp.ctrl.set([i], ctrlstr.ready, function(){
        mp.timerid.set([i], 0, function(){
          build.container(mp, i, dc[i], function(){
            if( i === nc -1 && _.isFunction(cb)){
              cb({ok:true});
            }
          });
        });
      });
    } //for
  });
};

build.container = function(mp, pos, container, cb){
  log.info({ok:true}, "try to build container: " + pos);
  mp.element.set([pos], container["Element"], function(){
    mp.title.set([pos], container["Title"], function(){
      log.info({ok:true}, "sync definition and state of container: " + pos);
      mp.definition.set([pos], container["Recipe"], function(){
        gen.setstate(mp, pos, container["Recipe"], ctrlstr.ready, function(){
          if(_.isFunction(cb)){
          cb();
          }
        });
      });
    });
  });
};

build.base = function(mp, doc, cb){
  mp.name        = gen.mod(doc.Name);
  mp.description = gen.mod(doc.Description);//---
  mp.exchange    = gen.mod(doc.Exchange);
  mp.recipes     = gen.mod(doc.Recipes);
  mp.tasks       = gen.mod(doc.Tasks);
  mp.date        = gen.mod(doc.Date);
  // container endpoints
  mp.id         = gen.mod({});
  mp.element    = gen.mod([]);
  mp.recipe     = gen.mod([]);
  mp.definition = gen.mod([]);
  mp.state      = gen.mod([]);
  mp.title      = gen.mod([]); //---
  mp.timerid    = gen.mod([]);
  mp.ctrl       = gen.mod([]);

  log.info({ok:true}, "build base mp");
  cb();
};
exports.build = build;