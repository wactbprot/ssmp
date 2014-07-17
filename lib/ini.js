var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require("bunyan"),
    deflt    = require("./default"),
    gen      = require("./generic"),
    net      = require("./net"),
    simjs    = require("./simdef"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * --*-- ini --*--
 *
 * ```mpid``` ist die ```id``` des Messprogrammdokuments
 * bzw. der Messprogrammdefinition im POST-Body
 */
module.exports = function(mps, req, cb){
  var id    = req.params.id,
      rb    = req.body,
      sim   = "sim";

  mps[id]  = {};
  var mp   = mps[id];
  mp.param = gen.mod(deflt);

  req.log.info({ok: true}, "Mp id received");

  if(id !== sim && typeof rb === "string" && rb === ctrlstr.load){
    if(mps.hasOwnProperty(id)){
      log.info({ok:true},"already initialized, try again")
    }
    net.doc(mp).get(id, function(error, doc){
      if(error){
        log.error({error:error}, "failed to load mp definition");
      }
      if(doc){
        log.info({ok:true}, "try to build mp");
        buildup(mp, doc, cb);
      }
    });
  }

  if(typeof rb === "object"){
    log.info({ok:true},"received mp definition by post request")
    buildup(mp, rb, cb);
  }
  if(id === sim){
    log.info({ok:true},"request the md simulation")
    buildup(mp, simjs, cb);
  }
};


var builddown = function(mp){
  var doc            = {};

  doc._id            = mp._id
  doc._rev           = mp._rev
  doc.Mp             = {};
  doc.Mp.Container   = [];

  doc.Mp.Name        = mp.name.get([]);
  doc.Mp.Description = mp.description.get([]);
  doc.Mp.Standard    = mp.standard;
  doc.Mp.Date        = mp.date;
  doc.Mp.Date.push({Type: "cloned",
                    Value: gen.vlDate()});

  doc.Mp.Exchange    = mp.exchange.get([]);
  doc.Mp.Recipes     = mp.recipes.get([]);
  doc.Mp.Tasks       = mp.tasks.get([]);

  for(var i = 0; i < mp.ctrl.get([]).length; i++){

    var cc = {};
    cc.Element     = mp.element.get([i]);
    cc.Recipe      = mp.recipe.get([i]);
    cc.Definition  = mp.definition.get([i]);
    cc.State       = mp.state.get([i]);
    cc.Title       = mp.title.get([i]);
    cc.Ctrl        = mp.ctrl.get([i]);
    cc.NoOfRepeats = mp.noOfRepeats.get([i]);

    doc.Mp.Container.push(cc);
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
  mp.date        = doc.Date;

  buildbase(mp, doc, function(){
    for(var i = 0; i < nc; i++){
      mp.ctrl.set([i], dc[i].Ctrl , function(){
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
  mp.obtimer     = gen.mod(0);
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
