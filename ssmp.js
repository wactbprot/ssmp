var ssmp = function(){
  var ndata   = require("ndata")
    , prog    = require("commander")
    , _       = require("underscore")
    , bunyan  = require("bunyan")
    , deflt   = require("./lib/default")

    , cstr    = deflt.ctrlStr
    , log     = bunyan.createLogger({name: deflt.appname})
    , ok      = {ok:true};

  prog.version("0.4.0")
  .option("-l, --load <mpid>", "the id of an mpd")
  .parse(process.argv);


  ndata.createServer({port: deflt.mem.port}).on('ready', function(){
    // starten der ndata Clients
    var load     = require("./lib/load")
      , run      = require("./lib/run")
      , build    = require("./lib/build")
      , observe  = require("./lib/observe")
      , mphandle = require("./lib/mphandle")
      , cdhandle = require("./lib/cdhandle")
      , utils    = require("./lib/utils")
      , ok       = {ok: true};

    log.info(ok
            , ".....................................\n"
            + "ssmp data server up and running @"
            + deflt.mem.port +"\n"
            + "....................................."
            );

      require("./http-api/server")(deflt, function(){
        var mem      = ndata.createClient({port: deflt.mem.port})
        load.ini(function(){
          run.ini(function(){
            build.ini(function(){
              observe.ini(function(){
                mphandle.ini(function(){
                  cdhandle.ini(function(){
                    if(prog.load){
                      mem.publish("get_mp", prog.load , function(err){
                        if(!err){
                          log.info(ok
                                  , " published to get_mp channel");
                        }else{
                          log.error({error:err}
                                  , "failed to published to get_mp channel");
                        }
                      });
                    }
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
