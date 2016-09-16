/**
 * The task workers
 *
 * @module worker
 */

var rscript           = "/usr/bin/Rscript"
  , nodeRelay         = require("./worker.nodeRelay");

exports[rscript]      = nodeRelay
exports.nodeRelay     = nodeRelay;
exports.VXI11         = nodeRelay;
exports.TCP           = nodeRelay;
exports.MODBUS        = nodeRelay;
exports.UDP           = nodeRelay;

exports.wait          = require("./worker.wait");
exports.message       = require("./worker.message");
exports.getTime       = require("./worker.getTime");
exports.getDate       = require("./worker.getDate");
exports.writeExchange = require("./worker.writeExchange");
exports.readExchange  = require("./worker.readExchange");
exports.getList       = require("./worker.getList");
exports.checkDB       = require("./worker.checkDB");
exports.checkRelay    = require("./worker.checkRelay");
exports.ctrlContainer = require("./worker.ctrlContainer")
exports.updateCd      = require("./worker.updateCd");
exports.select        = require("./worker.select");
exports.replicateDB   = require("./worker.replicateDB");
