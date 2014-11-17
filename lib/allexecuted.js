var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , deflt    = require("./default")
  , walk     = require("./walk")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: deflt.appname})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
  , mem      = ndata.createClient({port: 9000});

mem.subscribe("executed", function(err){
  if(!err){
    log.info(ok
            , "allexecuted subscribed to executed channel");
  }
})

mem.on('message', function(ch, path){
  var strpath = path.join(" ")
  if(ch == "executed"){
    log.info(ok
            , "receice executed event, try to set state ready");

    mem.get(path.concat(["recipe"]), function(err, recipe){
      if(!err){
        walk.cp(path.concat(["state"]), recipe , cstr.ready, function(){

          var cpath = path.concat(["ctrl"]);

          mem.get(cpath, function(err, cmdstr){
            if(!err){
              var cmdarr   = utils.cmd_to_array(cmdstr)
                , cmd      = _.first(cmdarr)
                , nctrlstr = _.rest(cmdarr).join(";")

              if(cmd !== cstr.mon){
                if(nctrlstr == ""){
                  nctrlstr = cstr.ready;
                }
                mem.set(cpath, nctrlstr,  function(err){
                  if(!err){
                    log.info(ok, "ctrl of path: " + strpath +" set to " + nctrlstr );
                  }else{
                    log.error({error:err}
                             , "error on try to set ctrl");
                  }
                }); // set nctrlstr
              } // mon
            }else{
              log.error({error:err}
                       , "error on try to get ctrl");
            }
          }); // get ctrlstr
          log.info(ok
                  , "sync definition and state of path: " + strpath);
        });
      }else{
        log.error({error:err}
                 , "error on try to get recipe");
      }
    });
  }
}); // on