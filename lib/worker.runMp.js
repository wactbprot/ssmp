/**
 * @module work.runMp
 */
var _ = require("underscore"),
  bunyan = require("bunyan"),
  conf = require("./conf"),
  utils = require("./utils"),
  broker = require("sc-broker"),
  log = bunyan.createLogger({
    name: conf.app.name + ".worker.runMp",
    streams: conf.log.streams
  }),
  mem = broker.createClient({
    port: conf.mem.port
  }),
  ro = {
    ok: true
  },
  err;

/**
 * ```runMp()``` starts container with number ```task.Container``` or
 with title  ```task.ContainerTitle``` of ```mpdef```.
 * @method runMp
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function(task, cb) {
  var path = task.Path,
    mpdef = task.Mp,
    cont = task.Container,
    ctitle = task.ContainerTitle,
    poll = 1000,
    ro = {
      ok: true
    },
    err;

  mem.get([mpdef], function(err, mp) {

    if (_.isUndefined(mp)) {
      err = new Error("get request to " + mpdef + " fails");
      log.error(err, "mp not available");
      cb(err);
    } else {
      var idx = mp.meta.container.Title.indexOf(ctitle);
      if (idx > -1) {
        cont = idx;
        log.trace(ro, "found container with title " + ctitle + "at position " + idx)
      }
      if (!_.isUndefined(cont)) {
        var cpath = [mpdef, cont, "ctrl"],
          cmd = [conf.ctrlStr.load, conf.ctrlStr.run].join(";");
        mem.set(cpath, cmd, function(err) {
          if (!err) {
            var inid = setInterval(function() {
              mem.get(cpath, function(err, res) {
                if (!err) {
                  if (res == conf.ctrlStr.ready) {
                    clearTimeout(inid);
                    cb(null, ro);
                  }
                } else {
                  clearTimeout(inid);
                  err = new Error("can not get mp below: " + cpath.join("."));
                  log.error(err);
                  cb(err);
                }
              });
            }, poll)
          } else {
            err = new Error("can not set mp below: " + cpath.join("."));
            log.error(err);
            cb(err);
          }
        }); //set cmd
      } else {
        err = new Error("can not find container with title: " + ctitle);
        log.error(err);
        cb(err);
      }
    }
  }); // get cpath

};
