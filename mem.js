var ndata   = require("ndata")
  , prog    = require("commander")
  , _       = require("underscore")
  , bunyan  = require("bunyan")
  , deflt   = require("./lib/default")
  , log     = bunyan.createLogger({name: deflt.appname})
  , ok      = {ok:true};

prog.version("0.1")
.option("-P, --port <port>", "port (default is  9000)", parseInt)
.parse(process.argv);

var port  = prog.ndataport || 9000
  , ds, dc;

ds = ndata.createServer({port: port});

ds.on('ready', function(){
  log.info({ok:true},
           "data server started");

  dc = ndata.createClient({port: port});
  dc.on('ready',function(){
    log.info({ok:true},
             "data client started");
  }); // client
}); // server