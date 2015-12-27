(function(){
  var ndata    = require("ndata")
    , bunyan   = require("bunyan")
    , prog     = require("commander")
    , conf     = require("./lib/conf")
    , defaults = require("./lib/default")
    , ok       = {ok:true}, err
    , log      = bunyan.createLogger({name: conf.app.name + ".server",
                                      streams: conf.log.streams
                                     })
    , server =  ndata.createServer({port: conf.mem.port});

  prog.version("0.7.0")
  .option("-r, --relay <server>", "name of relay server (default is localhost)")
  .option("-d, --database <server>", "name of database server (default is localhost)")
  .parse(process.argv);

  if(prog.relay){
    defaults.relay.server = prog.relay;
  }

  if(prog.database){
    defaults.database.server = prog.database;
  }


  server.on('ready', function(){
    var mem  = ndata.createClient({port: conf.mem.port})
    log.info(ok
            , "\n"
            + ".....................................\n"
            + "ssmp data server up and running @"
            + conf.mem.port +"\n"
            + ".....................................\n"
            );
    mem.set(["defaults"], defaults, function(err){
      log.info(ok
              , "set defaults");
    }); // set defaults
  });
  // http://stackoverflow.com/questions/23622051/how-to-forcibly-keep-a-node-js-process-from-terminating
  // require('net').createServer().listen();
  // process.stdin.resume();
})()