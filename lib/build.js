var _        = require("underscore")
  , bunyan   = require("bunyan")
  , deflt    = require("./default")
  , utils    = require("./utils")
  , walk     = require("./walk")
  , ndata    = require('ndata')
  , log      = bunyan.createLogger({name: deflt.appname})
  , ctrlstr  = deflt.ctrlStr
  , ok       = {ok:true}
  , mem      = ndata.createClient({port: 9000})

mem.subscribe("build", function(err){
  if(!err){
    log.info(ok
            , "observe subscribed to buildup channel");
  }
})

mem.on('message', function(ch, mpdoc){

  if(ch == "build"){
    var i
      , doc   = mpdoc.Mp
      , docid = mpdoc._id
      , dc    = doc.Container
      , Ndc   = dc.length;
    build_base([docid], mpdoc, function(path){
      mem.set(path.concat(["meta", "contN"]), Ndc, function(err){
        for(i = 0; i < Ndc; i++){
          var dci = dc[i]
            , ctrl  = dci.Ctrl || ctrlstr.ready;
          mem.set(path.concat([i, "ctrl"]), ctrl, (function(j){
                                                     return function(){
                                                       build_container(path.concat([j]), dci, function(){
                                                         if(j == Ndc - 1){
                                                           mem.publish("buildup", [docid], function(err){
                                                             if(!err){
                                                               log.info(ok
                                                                       , "mp builded, event published, exec callback");
                                                             }else{
                                                               log.error({error:err}
                                                                        , "error on publishing build event")
                                                             }
                                                           });
                                                         }
                                                       });
                                                   }}(i)));
        } //for
      }); // meta Ndc
    }); // build base
  } // if build
}); // on build


var build_container = function(path, container, cb){

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
  , build_base = function(path, mpdoc, cb){
      var meta = {}
        , doc = mpdoc.Mp;

      meta.id          = mpdoc._id                 || "";
      meta.rev         = mpdoc._rev                || "";
      meta.standard    = mpdoc.Standard            || "";
      meta.description = mpdoc.Description         || "__descr__";
      meta.name        = mpdoc.Name                || "__name__" ;
      meta.date        = mpdoc.Date                || [{Type: "build",
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