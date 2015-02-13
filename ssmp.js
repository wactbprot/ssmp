var ssmp = function(){
  var ndata   = require("ndata")
    , prog    = require("commander")
    , _       = require("underscore")
    , bunyan  = require("bunyan")
    , deflt   = require("./lib/default")
    , cstr    = deflt.ctrlStr
    , log     = bunyan.createLogger({name: deflt.appname})
    , ok      = {ok:true};

  prog.version("0.3")
  .option("-a, --all_statics", "load all statics on start up.")
  .option("-l, --statics_list <slist>", "name1,name2 (see folder ssmp/statics for available names)")
  .parse(process.argv);


  ndata.createServer({port: deflt.mem.port}).on('ready', function(){
    // starten der ndata Clients
    var load     = require("./lib/load")
      , run      = require("./lib/run")
      , build    = require("./lib/build")
      , observe  = require("./lib/observe")
      , mphandle = require("./lib/mphandle")
      , cdhandle = require("./lib/cdhandle")
      , ok       = {ok: true};

    log.info(ok
            , ".....................................\n"
            + "ssmp data server up and running @"
            + deflt.mem.port +"\n"
            + "....................................."
            );

    require("./http-api/http-ssmp")(deflt, function(){
      var mem      = ndata.createClient({port: deflt.mem.port})
        , statics  = {};
      if(prog.all_statics || prog.statics_list){
        var sts  = require("./lib/providejson")("./static/");
        if(prog.statics_list){
          var sl =  prog.statics_list.split(",")
          for(var j = 0; j < sl.length; j++){
            var sname = sl[j]
            if(sts[sname]){
              statics[sname] = sts[sname];
            }
          }
        }else{
          statics = sts;
        }
      }

      load.ini(function(){
        run.ini(function(){
          build.ini(function(){
            observe.ini(function(){
              mphandle.ini(function(){
                cdhandle.ini(function(){
                  for(var i in statics){

                    mem.set([i], statics[i], function(err){
                      if(!err){
                        log.info(ok
                                , "set static: " + i);
                        mem.publish("buildup", [i], function(err){
                          if(!err){
                            log.info(ok
                                    , "mp builded, event published, exec callback");
                          }else{
                            log.error({error:err}
                                     , "error on publishing build event")
                          }
                        });
                      }else{
                        log.info({error:err}
                                , "unable to set static " + i);
                      }
                    }); // publish
                  } // for

                });
              });
            });
          });
        });
      });
    });
    //require("./socketio-api/socket-ssmp")(deflt);

  }); // server
}
module.exports = ssmp;
