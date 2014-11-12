var _        = require("underscore"),
    bunyan   = require("bunyan"),
    deflt    = require("./default"),
    utils    = require("./utils"),
    observe  = require("./observe"),
    gen      = require("./generic"),
    walk     = require("./walk"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

var ndata = require('ndata');
var mem   = ndata.createClient({port: 9000})

var build = function(docmp, cb){

  var i
    , doc   = docmp.Mp
    , docid = docmp._id
    , dc    = doc.Container
    , Ndc   = dc.length;

  build_base([docid], doc, function(path){
    for(i = 0; i < Ndc; i++){

      var dci = dc[i]
        , ctrl  = dci.Ctrl || ctrlstr.ready;

      mem.set(path.concat(["ctrl", i]), ctrl, (function(j){
                                                 return function(){
                                                   build_container(path, j, dci, function(){
                                                    if(j == Ndc - 1){
                                                      log.info({ok:true}
                                                              , "exec call back");
                                                      //observe(mp, cb);
                                                    }
                                                  });
                                                }
                                               }(i)));
    } //for
  });
};

var build_container = function(path, pos, container, cb){

  log.info({ok:true}, "try to build container: " + pos);
  mem.set(path.concat(["element", pos]), container["Element"] || [],function(){
    log.info({ok:true}, "add element to container: " + pos);
    mem.set(path.concat(["contdescr", pos]), container["Description"] || "__description__", function(){
      log.info({ok:true}, "add description to container: " + pos);
      mem.set(path.concat(["title", pos]), container["Title"] || "__title__", function(){
        log.info({ok:true}, "add title to container: " + pos);
        mem.set(path.concat(["definition", pos]), container["Definition"] || [[{}]], function(){
          log.info({ok:true}, "add definition to container: " + pos);
          mem.get(path.concat(["definition", pos]), function(err, definition){
            walk.cp(path.concat(["state", pos]), definition , ctrlstr.ready, function(){
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

var build_base = function(path, doc, cb){
  var meta = {};

  meta.id          = doc._id                 || "";
  meta.rev         = doc._rev                || "";
  meta.standard    = doc.Standard            || "";
  meta.description = doc.Description         || "__descr__";
  meta.name        = doc.Name                || "__name__" ;
  meta.date        = doc.Date                || [{Type: "build",
                                                  Value: utils.vlDate()}];
  mem.set(path.concat(["meta"]), meta, function(err){
    mem.set(path.concat(["exchange"]), doc.Exchange || {}, function(err){
      mem.set(path.concat(["definitions"]), doc.Definitions || [], function(err){
        mem.set(path.concat(["tasks"]), doc.Tasks || [], function(err){
          mem.set(path.concat(["id"]), {}, function(err){

            log.info({ok:true}, "build base mp");
            if(_.isFunction(cb)){
              cb(path);
            }
          }); // id
        }); // tasks
      }); // definitions
    }); // exchange
  }); // meta
};

module.exports = build;