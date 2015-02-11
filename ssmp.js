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


  var mem = ndata.createServer({port: deflt.mem.port});

  mem.on('ready', function(){
    log.info({ok: true}
            , ".....................................\n"
            + "ssmp data server up and running @"
            + deflt.mem.port +"\n"
            + "....................................."
            );
    // starten der ndata Clients
    require("./lib/load");
    require("./lib/run");
    require("./lib/build");
    require("./lib/observe");
    require("./lib/mphandle");
    require("./lib/cdhandle");

    require("./http-api/http-ssmp")(deflt);
    //require("./socketio-api/socket-ssmp")(deflt);

  }); // server
}
module.exports = ssmp;
