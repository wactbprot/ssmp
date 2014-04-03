var dp     = require("./dp").dp,
mpdc       = require("./mpdoc").mpdc,
_          = require("underscore");

var status = function(req, res, next) {
    var msg = "ssmp up & running";
    res.send({message: msg});
    req.log.info({ok: true}, msg);

};
exports.status = status;

var getmpdoc = function(req, res, next) {

    var id = req.params.mpdoc;
    var doc   = mpdc.get(id);
    
    if(doc){
	req.log.info({ok: true}, 
		     "mpdoc " + id + " send");
	res.send(doc);	
    }else{
	req.log.error({ok: false}, 
		     "mpdoc " + id + " not found");
	res.send({error:"doc not found"});	

    }
    
};
exports.getmpdoc = getmpdoc;

var setmpdoc = function(req, res, next) {

    var mpdoc = req.params.mpdoc;
    var docid = req.body._id;

    if(mpdoc == docid){
        mpdc.set(req.body, function(){
                     res.send({ok:true});
                     req.log.info({ok: true},
                                  "set mp doc");
                 });
    }else{
        res.send({ok:false});
        req.log.info({ok: false},
                     "request url don't match docid");
    }
};
exports.setmpdoc = setmpdoc;

//    var db = nano("http://" +
//                  dp.get(database, server) + ":" +
//                  db.get(database, port)).use(db.get(database, name));
