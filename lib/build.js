var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , deflt    = require("./default")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: deflt.appname})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
  , mem      = ndata.createClient({port: 9000})

mem.subscribe("load_mp", function(err){
  if(!err){
    log.info(ok
            , "build subscribed to load_mp channel");
  }
})

mem.on('message', function(ch, val){
  if(ch == "load_mp"){
    var i
      , doc   = val.Mp
      , docid = val._id
      , dc    = doc.Container
      , Ndc   = dc.length;

    mem.publish("builddown", [docid], function(err){
      if(!err){
        mem.remove([docid], function(err){
          if(!err){
            log.info(ok
                    , "clean up: " + docid);
            build_base([docid], val, function(path){
              for(i = 0; i < Ndc; i++){
                build_container(path.concat([i]), dc[i], function(j){
                                                           return function(){
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
                                                           }}(i));
              } //for
            }); // build base
          }else{
            log.error({error:err}
                     , "error on attempt to clean up: " + docid)
          }
        }); // remove
      }else{
        log.error({error:err}
                 , "error on attempt to publish builddown: " + docid)
      }
    }); // publish builddown
  } // if build
}); // on build


var build_container = function(path, container, cb){
  var strpath = path.join(" ")
    , ok   = {ok:true}
  log.info(ok
          , "try to build container: " + strpath);
  mem.set(path.concat(["ctrl"]), container["Ctrl"] || cstr.ready, function(err){
    log.info(ok
            , "add ctrl to container: " + strpath);
    mem.set(path.concat(["element"]), container["Element"] || [],function(err){
      log.info(ok
              , "add element to container: " + strpath);
      mem.set(path.concat(["contdescr"]), container["Description"] || "__description__", function(err){
        log.info(ok
                , "add container description to : " + strpath);
        mem.set(path.concat(["title"]), container["Title"] || "__title__", function(err){
          log.info(ok
                  , "add title to container: " + strpath);
          mem.set(path.concat(["definition"]), container["Definition"] || [[{}]], function(err){
            log.info(ok
                    , "add definition to container: " + strpath);
            mem.get(path.concat(["definition"]), function(err, definition){
              utils.cp(path.concat(["state"]), definition , cstr.ready, function(){
                mem.publish("state", path, function(err){
                  if(!err){
                    log.info(ok
                            , "sync definition and state of container: " + strpath);
                    if(_.isFunction(cb)){
                      cb();
                    }
                  }
                }); // publish state
              });
            });
          });
        });
      });
    });
  });
};

var build_base = function(path, mpdoc, cb){
  var meta  = {}
    , ok    = {ok:true}
    , doc   = mpdoc.Mp
    , d     = [{Type: "build", Value: utils.vlDate()}]
    , ct    = []
    , dc    = doc.Container

  for(var i in dc){
    var t = dc[i].Title || "__container title__"
    ct.push(t);
  }

  meta.id          = mpdoc._id       || "";
  meta.rev         = mpdoc._rev      || "";

  meta.date        = doc.Date        || d
  meta.standard    = doc.Standard    || "";
  meta.description = doc.Description || "__descr__";
  meta.name        = doc.Name        || "__name__" ;
  meta.container   = {N :ct.length,
                      Title: ct};

    mem.set(path.concat(["meta"]), meta, function(err){
      mem.set(path.concat(["exchange"]), doc.Exchange || {}, function(err){
        mem.set(path.concat(["definitions"]), doc.Definitions || [], function(err){
          mem.set(path.concat(["tasks"]), doc.Tasks || [], function(err){
            mem.set(path.concat(["id"]), {}, function(err){
            log.info(ok, "build base mp");
              if(_.isFunction(cb)){
                cb(path);
              }
            }); // id
          }); // tasks
      }); // definitions
    }); // exchange
  }); // meta

};