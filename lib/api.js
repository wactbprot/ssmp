var nano   = require('nano');

var status = function(req, res, next) {

    var msg = "ssmp up & running";
    res.send({message: msg});
    req.log.info({ok: true}, msg);    
    
};
exports.status = status;

var getmpdoc = function(req, res, next) {
    req.param.mpdoc
    
};
exports.getmpdoc = status;

