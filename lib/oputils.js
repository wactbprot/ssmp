var _        = require("underscore"),
    bunyan   = require("bunyan"),
    deflt    = require("./default"),
    gen      = require("./generic"),
    net      = require("./net"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;


var repltask = function(task, token, value){

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



var builddown = function(mp){
  var doc         = {};
  doc._id         = mp._id
  doc._rev        = mp._rev

  doc.Name        = mp.name.get([]);
  doc.Description = mp.description.get([]);
  doc.Standard    = mp.Standard;

  doc.Date        = mp.Date;
  doc.Date.push({Type: "cloned",
                 Value: gen.vlDate()})

  doc.Exchange    = mp.exchange.get([]);
  doc.Recipes     = mp.recipes.get([]);
  doc.Tasks       = mp.tasks.get([]);

  doc.Container   = [];
  for(var i = 0; i < mp.ctrl.get([]).length; i++){

    var cc = {};
    cc.Element     = mp.element.get([i]);
    cc.Recipe      = mp.recipe.get([i]);
    cc.Definition  = mp.definition.get([i]);
    cc.State       = mp.state.get([i]);
    cc.Title       = mp.title.get([i]);
    cc.Ctrl        = mp.ctrl.get([i]);
    cc.NoOfRepeats = mp.noOfRepeats.get([i]);

    doc.Container.push(cc);

  }

return doc;
}



var buildup = function(mp, docmp, cb){
  var doc  = docmp.Mp,
      dc   = doc.Container,
      nc   = dc.length;

  mp._rev        = docmp._rev;
  mp._id         = docmp._id;
  mp.standard    = doc.Standard;
  mp.Date        = doc.Date;

  buildbase(mp, doc, function(){
    for(var i = 0; i < nc; i++){
      mp.ctrl.set([i], ctrlstr.ready, function(){
        mp.timerid.set([i], 0, function(){
          buildcontainer(mp, i, dc[i], function(){
            if( i === nc -1 && _.isFunction(cb)){
              cb({ok:true});
            }
          });
        });
      });
    } //for
  });
};

var buildcontainer = function(mp, pos, container, cb){
  log.info({ok:true}, "try to build container: " + pos);
  mp.element.set([pos], container["Element"], function(){
    log.info({ok:true}, "add element to container: " + pos);
    mp.title.set([pos], container["Title"], function(){
      log.info({ok:true}, "add title to container: " + pos);
      mp.definition.set([pos], container["Definition"], function(){
        log.info({ok:true}, "add recipe to container: " + pos);
        mp.noOfRepeats.set([pos], container["NoOfRepeats"], function(){
          log.info({ok:true}, "add NoOfRepeats to container: " + pos);
          if(container["State"]){
            mp.state.set([pos], container["State"], function(){
              log.info({ok:true}, "use given state of container: " + pos);
              if(_.isFunction(cb)){
                cb();
              }
            });
          }else{
            gen.setstate(mp, pos, container["Definition"], ctrlstr.ready, function(){
              log.info({ok:true}, "sync definition and state of container: " + pos);
              if(_.isFunction(cb)){
                cb();
              }
            });
          }
        });
      });
    });
  });
};

var buildbase = function(mp, doc, cb){
  mp.name        = gen.mod(doc.Name);
  mp.description = gen.mod(doc.Description);
  mp.exchange    = gen.mod(doc.Exchange);
  mp.recipes     = gen.mod(doc.Recipes);
  mp.tasks       = gen.mod(doc.Tasks);

  mp.id          = gen.mod({});
  // container endpoints
  mp.element     = gen.mod([]);
  mp.recipe      = gen.mod([]);
  mp.definition  = gen.mod([]);
  mp.state       = gen.mod([]);
  mp.title       = gen.mod([]);
  mp.timerid     = gen.mod([]);
  mp.ctrl        = gen.mod([]);
  mp.noOfRepeats = gen.mod([]);

  log.info({ok:true}, "build base mp");
  cb();
};
exports.buildup   = buildup;
exports.builddown = builddown;
