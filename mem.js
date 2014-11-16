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
  , ds   = ndata.createServer({port: port});
