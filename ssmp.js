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
  var conf = {memport   : 9000,
              httpport  : 8001,
              socketport: 8002}


  var mem = ndata.createServer({port: conf.memport});

  mem.on('ready', function(){
    log.info({ok: true}
            , ".....................................\n"
            + "ssmp data server up and running @"
            + conf.memport +"\n"
            + "....................................."
            );
    // starten der ndata Clients
    require("./lib/load");
    require("./lib/run");
    require("./lib/build");
    require("./lib/observe");
    require("./lib/mphandle");
    require("./lib/cdhandle");

    require("./http-ssmp")(conf);
  //  require("./socket-ssmp")(conf);

  }); // server
}
module.exports = ssmp;
