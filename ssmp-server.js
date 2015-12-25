(function(){
  var ndata    = require("ndata")
    , prog     = require("commander")
    , bunyan   = require("bunyan")
    , conf     = require("./lib/conf")
    , defaults = require("./lib/default")
    , ok       = {ok:true}, err
    , log      = bunyan.createLogger({name: conf.app.name + ".server",
                                     streams: conf.log.streams
                                    })

  prog.version("0.7.0")
  .option("-l, --load <mpid>", "the id of an mp-definition to load on start")
  .option("-r, --relay <server>", "name of relay server (default is localhost)")
  .option("-d, --database <server>", "name of database server (default is localhost)")
  .parse(process.argv);

  if(prog.relay){
    defaults.relay.server = prog.relay;
  }
  if(prog.database){
    defaults.database.server = prog.database;
  }

  if(prog.load){
    defaults.load = prog.load;
  }

  ndata.createServer({port: conf.mem.port}).on('ready', function(){
    var mem  = ndata.createClient({port: conf.mem.port})
    log.info(ok
            , "\n"
            + ".....................................\n"
            + "ssmp data server up and running @"
            + conf.mem.port +"\n"
            + ".....................................\n"
            );

    mem.set(["defaults"], defaults, function(err){
      mem.get(["defaults"], function(err, d){
        log.trace(d
                 , "set defaults");

      });
    });
  });
  // http://stackoverflow.com/questions/23622051/how-to-forcibly-keep-a-node-js-process-from-terminating
  // require('net').createServer().listen();
  // process.stdin.resume();
})()