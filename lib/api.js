/**
 * wenn hier nano mit localhost initialisiert wird
 * muss localhost immutable werden --> no!
 *
 */
var nano   = require("nano"),
    dp     = require("./dp");

var status = function(req, res, next) {

    var msg = "ssmp up & running";
    res.send({message: msg});
    req.log.info({ok: true}, msg);

};
exports.status = status;
/**
 * Den Performanceverlust durch das
 * "stets Initialisieren von nano bei jedem
 * getmp" ist vertretbar bzw. eher in Kauf
 * zu nehmen als einen Mechanismus der "localhost"
 * immutable macht ...
 *
 */
var getmpdoc = function(req, res, next) {
  var db = nano("http://" +
                dp.globals.server + ":" +
                db.globals.port + "/" +
                db.globals.name);

    ... get ... req.param.mpdoc

};
exports.getmpdoc = status;
