var _        = require("underscore")
  , bunyan   = require("bunyan")
  , deflt    = require("./default")
  , utils    = require("./utils")
  , walk     = require("./walk")
  , ndata    = require('ndata')
  , log      = bunyan.createLogger({name: deflt.appname})
  , ctrlstr  = deflt.ctrlStr
  , mem      = ndata.createClient({port: 9000})
  , build    = function(docmp, cb){
      var i
        , doc   = docmp.Mp
        , docid = docmp._id
        , dc    = doc.Container
        , Ndc   = dc.length;

      build_base([docid], docmp, function(path){
        mem.set(path.concat(["meta", "contN"]), Ndc, function(err){
          for(i = 0; i < Ndc; i++){
            var dci = dc[i]
              , ctrl  = dci.Ctrl || ctrlstr.ready;
            mem.set(path.concat([i, "ctrl"]), ctrl, (function(j){
                                                       return function(){
                                                       build_container(path.concat([j]), dci, function(){
                                                         if(j == Ndc - 1){
                                                           mem.publish("buildup", [docid], function(err){
                                                             var ro;
                                                             if(!err){
                                                               ro = {ok:true}
                                                               log.info(ro
                                                                       , "mp builded, event published, exec callback");
                                                               cb(ro)
                                                             }else{
                                                               ro ={error:err}
                                                               log.error(ro
                                                                        , "error on publishing build event")
                                                               cb(ro)
                                                             }
                                                           });
                                                           //observe(mp, cb);
                                                         }
                                                       });
                                                       }}(i)));
          } //for
        }); // meta Ndc
      });
    }
  , build_container = function(path, container, cb){

      var strpath = path.join(" ")

      log.info({ok:true}
              , "try to build container: " + strpath);
      mem.set(path.concat(["element"]), container["Element"] || [],function(err){
        log.info({ok:true}
                , "add element to container: " + strpath);
        mem.set(path.concat(["contdescr"]), container["Description"] || "__description__", function(err){
          log.info({ok:true}
                  , "add description to container: " + strpath);
          mem.set(path.concat(["title"]), container["Title"] || "__title__", function(err){
            log.info({ok:true}
                    , "add title to container: " + strpath);
            mem.set(path.concat(["definition"]), container["Definition"] || [[{}]], function(err){
              log.info({ok:true}
                      , "add definition to container: " + strpath);
              mem.get(path.concat(["definition"]), function(err, definition){
                walk.cp(path.concat(["state"]), definition , ctrlstr.ready, function(){
                  log.info({ok:true}
                          , "sync definition and state of container: " + strpath);
                  if(_.isFunction(cb)){
                    cb();
                  }
                });
              });
            });
          });
        });
      });
    }
  , build_base = function(path, docmp, cb){
      var meta = {}
        , doc = docmp.Mp;

      meta.id          = docmp._id                 || "";
      meta.rev         = docmp._rev                || "";
      meta.standard    = docmp.Standard            || "";
      meta.description = docmp.Description         || "__descr__";
      meta.name        = docmp.Name                || "__name__" ;
      meta.date        = docmp.Date                || [{Type: "build",
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