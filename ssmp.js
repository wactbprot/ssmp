var ssmp = function(){
  var ndata   = require("ndata")
    , prog    = require("commander")
    , _       = require("underscore")
    , bunyan  = require("bunyan")
    , deflt   = require("./lib/default")
    , cstr    = deflt.ctrlStr
    , log     = bunyan.createLogger({name: deflt.appname})
    , ok      = {ok:true};

  prog.version("0.2")
  .option("-P, --port <port>", "http port (default is  8001)", parseInt)
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
        , statics  = require("./lib/providejson")("./static/");

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
