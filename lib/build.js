var _        = require("underscore"),
    bunyan   = require("bunyan"),
    deflt    = require("./default"),
    utils    = require("./utils"),
    observe  = require("./observe"),
    gen      = require("./generic"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

var build = function(mp, docmp, cb){
  var doc  = docmp.Mp,
      dc   = doc.Container,
      nc   = dc.length;

  build_base(mp, doc, function(){
    for(var i = 0; i < nc; i++){
      mp.ctrl.set([i], dc[i].Ctrl || ctrlstr.ready , function(){

          build_container(mp, i, dc[i], function(){
            if( i === nc -1 && _.isFunction(cb)){
              log.info({ok:true}, "try to start observer");
              observe(mp);
              log.info({ok:true}, "exec call back");
              cb({ok:true});
            }
          });
        });

    } //for
  });
};

var build_container = function(mp, pos, container, cb){
  log.info({ok:true}, "try to build container: " + pos);
  mp.element.set([pos], container["Element"] || [],function(){
    log.info({ok:true}, "add element to container: " + pos);
    mp.contdescr.set([pos], container["Description"] || "__description__", function(){
      log.info({ok:true}, "add description to container: " + pos);
      mp.title.set([pos], container["Title"] || "__title__", function(){
        log.info({ok:true}, "add title to container: " + pos);
        mp.definition.set([pos], container["Definition"] || [[{}]], function(){
          log.info({ok:true}, "add recipe to container: " + pos);
          mp.onerror.set([pos], container["OnError"] || "error", function(){
            log.info({ok:true}, "add onerror to container: " + pos);
            mp.definition.get([pos], function(definition){
              gen.setstate(mp, pos, definition , ctrlstr.ready, function(){
                log.info({ok:true}, "sync definition and state of container: " + pos);
                if(_.isFunction(cb)){
                  cb();
                }
              });
            });
          });
        });
      });
    });
  });
};

var build_base = function(mp, doc, cb){

  mp._id         = doc._id                 || "";
  mp._rev        = doc._rev                || "";
  mp.standard    = doc.Standard            || "";
  mp.description = doc.Description         || "__descr__";
  mp.date        = doc.Date                || [{Type: "build",
                                                Value: utils.vlDate()}];
  mp.name        = doc.Name                || "__name__" ;
  mp.param       = deflt

  mp.exchange    = gen.mod(doc.Exchange    || {});
  mp.recipes     = gen.mod(doc.Recipes     || []);
  mp.tasks       = gen.mod(doc.Tasks       || []);
  mp.id          = gen.mod({});
  // container endpoints
  mp.element     = gen.mod([]);
  mp.recipe      = gen.mod([]);
  mp.definition  = gen.mod([]);
  mp.state       = gen.mod([]);
  mp.title       = gen.mod([]);
  mp.ctrl        = gen.mod([]);
  mp.onerror     = gen.mod([]);
  mp.contdescr   = gen.mod([]);

  log.info({ok:true}, "build base mp");
  if(_.isFunction(cb)){
    cb();
  }
};

module.exports = build;