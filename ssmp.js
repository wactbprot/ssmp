var ssmp = function(){
  var ndata   = require("ndata")
    , prog    = require("commander")
    , _       = require("underscore")
    , deflt   = require("./lib/default")
    , cstr    = deflt.ctrlStr
    , bunyan  = require("bunyan")
    , logStrm = require("bunyan-couchdb-stream")
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
    // start logger; write to db
    var logurl  = 'http://'
                + deflt.database.server
                + ":"
                + deflt.database.port
                + "/"
                + deflt.database.logdbprefix
                + "-"
                + utils.vl_date(false, true)

      , log = bunyan.createLogger({name: deflt.app.name,
                                   streams: [{
                                     stream: new logStrm(logurl),
                                     type: 'raw'
                                   }]});

    log.info(ok
            , "\n"
            + ".....................................\n"
            + "ssmp data server up and running @"
            + deflt.mem.port +"\n"
            + ".....................................\n"
            );

    require("./api/json-srv")(deflt, function(){
      require("./info/info-srv")(deflt, function(){
        var mem      = ndata.createClient({port: deflt.mem.port})
        load.ini(function(err){
          run.ini(function(err){
            build.ini(function(err){
              observe.ini(function(err){
                mphandle.ini(function(err){
                  cdhandle.ini(function(err){
                    if(prog.load){
                      mem.publish("get_mp", prog.load , function(err){
                        if(!err){
                          log.info(ok
                                  , " published to get_mp channel");
                        }else{
                          log.error(err
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
    }); // info server
  }); // http server
}
module.exports = ssmp;
