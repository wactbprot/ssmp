var ssmp = function(){
  var ndata   = require("ndata")
    , prog    = require("commander")
    , _       = require("underscore")
    , conf    = require("./lib/conf")
    , bunyan  = require("bunyan")
    , logStrm = require("bunyan-couchdb-stream")
    , ok      = {ok:true};


  prog.version("0.7.0")
  .option("-l, --load <mpid>", "the id of an mp-definition to load on start")
  .option("-r, --relay <server>", "name of relay server (default is localhost)")
  .option("-d, --database <server>", "name of database server (default is localhost)")
  .parse(process.argv);

  ndata.createServer({port: conf.mem.port}).on('ready', function(){
    var mem        = ndata.createClient({port: conf.mem.port});
    var defaults   = require("./lib/default")

    if(prog.relay){
      defaults.relay.server = prog.relay;
    }
    if(prog.database){
      defaults.database.server = prog.database;
    }
    mem.set(["defaults"], defaults, function(err){
      mem.get(["defaults"], function(err, d){

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
                  + d.database.server
                  + ":"
                  + d.database.port
                  + "/"
                  + d.database.logdbprefix
                  + "-"
                  + utils.vl_date(false, true)

        , log = bunyan.createLogger({name: conf.app.name,
                                     streams: [{
                                       stream: new logStrm(logurl),
                                       type: 'raw'
                                     }]});
        log.info(ok
              , "\n"
              + ".....................................\n"
              + "ssmp data server up and running @"
              + conf.mem.port +"\n"
              + ".....................................\n"
              );

      require("./api/json-srv")(d, function(){
        require("./info/info-srv")(d, function(){
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
      }); // get defaults
    }); // set defaults
  }); // http server
}
module.exports = ssmp;
