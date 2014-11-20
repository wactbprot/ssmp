(function(){
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

  var memport  = 9000

  var mem = ndata.createServer({port: memport});

  mem.on('ready', function(){
    log.info({ok:true},
             "data server started");

    // starten der ndata Clients
    require("./lib/load");
    require("./lib/run");
    require("./lib/build");
    require("./lib/observe");

    require("http-ssmp");
    require("socket-ssmp");


  }); // server
}).call(this);