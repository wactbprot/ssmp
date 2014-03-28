var status = function(req, res, next) {
    
    res.send({message:'ssmp up & running'});
    req.log.info({ok: true}, 'status');    
    
};
exports.status = status;
