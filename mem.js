var ndata   = require("ndata")
  , prog    = require("commander")
  , _       = require("underscore")
  , bunyan  = require("bunyan")
  , deflt   = require("./lib/default")
  , cstr    = deflt.ctrlStr
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

  dc.on('ready', function(){
    log.info({ok:true},
             "data client started");

    var channels = [
      "worker"
    , "ctrl"
    , "load_cd"
    , "load_mp"
    , "buildup"
    , "builddown"
    , "recipe"
    , "exchange"
    , "state"
    , cstr.exec
    , cstr.load
    , cstr.run
    ];

    for(var i in channels){
      var channel = channels[i];
      dc.subscribe(channel,function(c){
                             return function(err){
                               if(!err){
                                 log.info(ok
                                         , "mem.js subscribed to channel: " + c);
                               }
                             }}(channel))
    }

    dc.on("message",  function(ch, val){
      log.info(val, "event received on channel: " + ch)
    });

  }); // client
}); // server