var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , deflt    = require("./default")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , log = bunyan.createLogger({name: deflt.app.name + ".worker.nodeRelay",
                               streams: [
                                 {
                                   stream: new logStrm(utils.logurl),
                                   level: 'debug',
                                   type: 'raw'
                                 },{
                                   level: 'info',
                                   stream: process.stdout
                                 }
                               ]
                              })
  , ro       = {ok: true}
  , err;

/**
 * (Mess-) Aufträge an den _node-relay_-server
 * werden an diesen mit der ```nodeRelay()```
 * Funktion gesandt.
 * @method nodeRelay
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){
  var path    = task.Path;

  log.info(ro,
           "call function nodeRelay"
              + "try request to nodeRelay");
  if(path && _.isArray(path)){
    var con     = net.relay()
      , wrtdata = JSON.stringify(task);

    request.exec(con, task, wrtdata, function (err, data){
      if(!data && err){
        log.error(err
                 , "received error in callback");
        cb(err);
      }
      if(data){
        log.info(ro
                , "request callback succesful");
        if(data.ok){
          log.info(ro
                  , " exec callback with simple ok");
          cb(null, data);
        }else{
          var dp = task.DocPath    && task.DocPath    !== ""
            , ep = data.ToExchange && data.ToExchange !== ""
            , rr = data.Result     && data.Result     !== "";

          if(dp && ep){
            log.info(ro
                    , "found DocPath and ToExchange, try to save");
            utils.query_cd(task, data, function (err, res){
              if(!err){
                log.info(ro,
                         "try to write to exchange");
                utils.write_to_exchange(task, data, cb);
              }else{
                log.error(err,
                          "try to write to exchange");
                cb(err);
              }
            })
          } // dp & ep

          if(dp && !ep){
            log.info(ro,
                     "found DocPath and Results try to save");
            utils.query_cd(task, data, cb)
          } // dp && !ep

          if(!dp && ep){
            log.info(ro,
                     "found ToExchange, try to exchange");
            utils.write_to_exchange(task, data, cb)

          } //!dp && ep

          if(!dp && !ep && rr){
            log.info(ro,
                     "simple pass with Result: "
                        + JSON.stringify(data.Result));
            cb(null, ro);
          } //!dp && ep
        } // else data.ok
      } // data.error
    });
  }else{
    err = new Error("wrong path")
    log.error(err,
              "missing path or path is not an array");
    if(_.isFunction(cb)){
      cb(err);
    }
  }
};
