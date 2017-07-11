/**
 * @module work.runMp
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , broker   = require("sc-broker")
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.runMp",
                                    streams: conf.log.streams
                                   })
  , mem      = broker.createClient({port: conf.mem.port})
  , ro       = {ok: true}
  , err;


/**
 * ```runMp()``` startet mpdefund wartet bis ready
 * an der ctrl api auftaucht
 * @method runMp
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function(task, cb){
  var path    = task.Path
    , mpdef   = task.Mp
    , cont    = task.Container
    , poll    = 1000
    , ro      = {ok: true}
    , err
    , cpath  = [mpdef, cont, "ctrl"];

  mem.get(cpath, function(err, res){
    if (_.isUndefined(res)) {
      err = new Error("get request to " + cpath.join(".") + " fails");
      log.error(err
               , "mp not available");
      cb(err);
    } else {
      mem.set(cpath, [conf.ctrlStr.load, conf.ctrlStr.run].join(";"), function(err){
        if (!err) {
          var inid = setInterval(function(){
                       mem.get(cpath, function(err, res){
                         if (!err) {
                             if ( res == conf.ctrlStr.ready) {
                               clearTimeout(inid);
                               cb(null, ro);
                             }
                         } else {
                             clearTimeout(inid);
                           err = new Error("can not get mp below: " + cpath.join("."));
                           cb(err);
                         }
                       });

                     }, poll)
        } else {
          err = new Error("can not set mp below: " + cpath.join("."))
          cb(err);
        }
      });
    }
  });
};
