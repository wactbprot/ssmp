var _        = require("underscore"),
    bunyan   = require("bunyan"),
    deflt    = require("./default"),
    utils    = require("./utils"),
    observe  = require("./observe"),
    gen      = require("./generic"),
    walk     = require("./walk"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

var build = function(mp, docmp, cb){

  var doc  = docmp.Mp,
      dc   = doc.Container,
      Ndc  = dc.length;

  build_base(mp, doc, function(mp){
    for(var i = 0; i < Ndc; i++){
      var ctrl = dc[i].Ctrl || ctrlstr.ready;

      mp.ctrl.set([i], ctrl, function(){
        build_container(mp, i, dc[i], function(last){
                                        return  function(){
                                          if(last){
                                            log.info({ok:true}
                                                    , "exec call back");
                                            observe(mp, cb);
                                          }
                                        }
                                      }(i == Ndc - 1));
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
            mp.definition.get([pos], function(definition){
              walk.setstate(mp, pos, definition , ctrlstr.ready, function(){
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
};

var build_base = function(mp, doc, cb){
  var meta = {};

  meta.id          = doc._id                 || "";
  meta.rev         = doc._rev                || "";
  meta.standard    = doc.Standard            || "";
  meta.description = doc.Description         || "__descr__";
  meta.name        = doc.Name                || "__name__" ;
  meta.date        = doc.Date                || [{Type: "build",
                                                  Value: utils.vlDate()}];
  mp.meta          = gen.mod(meta);

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
  mp.contdescr   = gen.mod([]);

  log.info({ok:true}, "build base mp");
  if(_.isFunction(cb)){
    cb(mp);
  }
};

module.exports = build;