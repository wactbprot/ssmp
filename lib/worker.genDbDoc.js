/**
 * @module work.genDoc
 */
var _ = require("underscore"),
  bunyan = require("bunyan"),
  broker = require("sc-broker"),
  net = require("./net"),
  request = require("./request"),
  conf = require("./conf"),
  utils = require("./utils"),
  log = bunyan.createLogger({
    name: conf.app.name + ".worker.genDbDoc",
    streams: conf.log.streams
  }),
  mem = broker.createClient({
    port: conf.mem.port
  })

  ,
  ro = {
    ok: true
  },
  err;


/**
 * ```genDbDoc()```generates a document based on ```Task.Value```
 * @method wait
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function(task, cb) {
  var path = task.Path,
    mdoc = task.Value,
    wrtdata = JSON.stringify(mdoc),
    val = {
      id: path[0],
      cdid: mdoc._id
    }

  net.docinfo(mdoc._id, function(err, rcon) {
    request.exec(rcon, task, null, function(err, data) {
      if (!err) {
        if (!data.DocInfo) {
          net.wrtdoc(mdoc._id, function(err, wcon) {
            request.exec(wcon, task, wrtdata, function(err, data) {
              if (err) {
                log.error(err, "received error in callback");
                cb(err);
              } else {

                log.info(ro,
                  "generated database document doc:" + JSON.stringify(data));
                mem.publish("get_cd", val, function(err) {
                  if (!err) {
                    log.trace(ro, "published to get_cd channel");
                    if (_.isFunction(cb)) {
                      cb(null, ro)
                    }
                  } else {
                    log.error(err, "error on attempt to publish to get_cd channel");
                    if (_.isFunction(cb)) {
                      cb(err)
                    }
                  }
                });
              }
            }); // write exec
          }); // write conn
        } else {
          log.info(ro, "document with id: " + mdoc._id +
            " already exists,try to  publish anyway to get_cd");
            
          mem.publish("get_cd", val, function(err) {
            if (!err) {
              log.trace(ro, "published to get_cd channel");
              if (_.isFunction(cb)) {
                cb(null, ro)
              }
            } else {
              log.error(err, "error on attempt to publish to get_cd channel");
              if (_.isFunction(cb)) {
                cb(err)
              }
            }
          });
        }
      } else {
        log.error(err, "error on attempt to check for db document info");
        if (_.isFunction(cb)) {
          cb(err)
        }
      }
    }); // read exec
  }); // read conn
};
