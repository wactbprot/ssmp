var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , deflt    = require("./default")
  , net      = require("./net")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: deflt.appname})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
  , mem      = ndata.createClient({port: 9000})

mem.subscribe("get_mp", function(err){
  if(!err){
    log.info(ok
            , "mphandle subscribed to get_mp channel");
  }
});

mem.on('message', function(ch, val){
  if(ch == "get_mp"){
    var con = net.rddoc(val);
    request.exec(con, false, false, function(mpdoc){
      log.info(ok
              , "receive mp definition from data base");
      mem.publish("load_mp", mpdoc, function(err){
        if(!err){
          log.info(ok
                  , "published to load_mp channel");
        }else{
          log.info({error:err}
                  , "error on attempt to publish to load_mp channel");
        }
      });
    });
  }
});