(function() {
  var name    = "socket-ssmp"
    , ndata   = require("ndata")
    , prog    = require("commander")
    , _       = require("underscore")
    , bunyan  = require("bunyan")
    , deflt   = require("./lib/default")
    , cstr    = deflt.ctrlStr
    , log     = bunyan.createLogger({name: name})
    , ok      = {ok:true};

  var memport  = 9000

  var mem = ndata.createClient({port: memport});

  mem.on('ready', function(){
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
      mem.subscribe(channel,function(c){
                              return function(err){
                                if(!err){
                                  log.info(ok
                                          , "mem.js subscribed to channel: " + c);
                                }
                              }}(channel))
    }

    mem.on("message",  function(ch, val){
      log.info(val, "event received on channel: " + ch)
    });
  });
}).call(this);