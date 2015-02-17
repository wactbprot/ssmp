var  name    = "http-ssmp"
  , _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , ndata    = require("ndata")
  , deflt    = require("./default")
  , net      = require("./net")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: name})
  , ctrlstr  = deflt.ctrlStr
  , ok       = {ok:true}

var mem = ndata.createClient({port: deflt.mem.port});

/**
 * Description
 * @method ini
 * @param {Function} cb
 */
var ini = function(cb){
  mem.subscribe("get_cd", function(err){
    if(!err){
      log.info(ok
              , "cdhandle.js subscribed to get_cd channel");
      mem.subscribe("rm_cd", function(err){
        if(!err){
          log.info(ok
                  , "cdhandle.js subscribed to rm_cd channel");
          if( _.isFunction(cb)){
            cb(ok);
          }
        }
      });
    }
  });
}
exports.ini = ini;

mem.on('message', function(ch, val){
  var ro   = {ok: true}
    , id   = val.id
    , cdid = val.cdid
    , path = [id, "id", cdid];
  if(ch == "get_cd"){
    log.info(ro
            ,"try to add id: " + cdid);
    var con = net.docinfo(cdid);
    request.exec(con, false, false, function(docinfo){
      log.info(ok
              ,"receive doc info data, try to store ");

      mem.set(path, docinfo, function(err){
        if(!err){
          mem.publish("update_cd", path, function(err){
            if(!err){
              log.info(ro
                      ,"doc added see mpid/id/"
                      + cdid);
            }else{
              ro = {error:err};
              log.error(ro
                       , "on attempt to publish to handle_cd channel");
            }
          }); // publish
        }else{
          ro = {error: err};
          log.error(ro
                   ,"error adding doc: " + cdid);
        }
      }); // set
    }); // request
  }

  if(ch == "rm_cd"){
    log.info(ro
            ,"try to remove id: " + cdid);
    mem.remove( path, function(err){
      if(!err){
        mem.publish("update_cd", path, function(err){
          if(!err){
            log.info(ro
                    ,"doc with id: " + cdid + "removed");
          }else{
            ro = {error:err};
            log.error({error:err}
                     , "on attempt to publish to handle_cd channel");
          }
        }); // publish
      }else{
        ro = {error: err}
        log.error(ro
                 , "on attempt to remove cd: "  + cdid );
      }
    }); // remove
  }
});
