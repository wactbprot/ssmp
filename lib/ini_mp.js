var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require("bunyan"),
    deflt    = require("./default"),
    gen      = require("./generic"),
    net      = require("./net"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * --*-- ini --*--
 *
 * ```mpid``` ist die ```id``` des Messprogrammdokuments
 * bzw. der Messprogrammdefinition im POST-Body
 */
var ini_mp = function(mps, req, cb){
  var id    = req.params.id,
      rb    = req.body;

  log.info({ok: true}, "Mp id received");

  if(mps.hasOwnProperty(id)){
    log.info({ok:true},"already initialized, try again")
  }

  mps[id]  = {};
  var mp   = mps[id];
  mp.param = gen.mod(deflt);

  if(typeof rb === "string" && rb === ctrlstr.load){

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
};


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
        mp.onerror.set([pos], container["OnError"] || "error", function(){
          log.info({ok:true}, "add NoOfRepeats to container: " + pos);
          gen.setstate(mp, pos, container["Definition"], ctrlstr.ready, function(){
            log.info({ok:true}, "sync definition and state of container: " + pos);
              if(_.isFunction(cb)){
                cb();
              }
          });
        });
      });
    });
  });
};

var buildbase = function(mp, doc, cb){
  mp.name        = gen.mod(doc.Name        ? doc.Name: "__name__" );
  mp.description = gen.mod(doc.Description ? doc.Description : "__descr__");

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
  mp.onerror     = gen.mod([]);


  log.info({ok:true}, "build base mp");
  cb();
};
module.exports = ini_mp;