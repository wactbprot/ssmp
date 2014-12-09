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
  }else{
    log.error({error:err}
             , "can not subscribe to get_mp channel");
  }
});

mem.subscribe("rm_mp", function(err){
  if(!err){
    log.info(ok
            , "mphandle subscribed to rm_mp channel");
  }else{
    log.error({error:err}
             , "can not subscribe to rm_mp channel");
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

  if(ch == "rm_mp"){
    var id = val;
    // no security, just throw it away
    mem.publish("builddown", [id],function(err){
      if(!err){
        log.info(ok
                , "published to builddown channel");

        mem.remove([id],true ,function(err, val){
          // got the old mp in var val
          // maybe write a restore options
          if(!err){
            log.info(ok,
                     "mp: " + id + "removed");
          }else{
            log.error({error:err}
                     , "on attempt to remove mp: " + id);
          }
        });
      }else{
        log.error({error:err}
                 , "can not publish to builddown channel");
      }
    });
  }
});