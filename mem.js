var ndata   = require("ndata"),
    prog    = require("commander")

prog.version("0.1")
.option("-P, --port <port>", "port (default is  9000)", parseInt)
.parse(process.argv);

var  port  = prog.ndataport || 9000
  , dataServer = ndata.createServer({port: port})
