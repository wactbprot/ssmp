var dp     = require("./dp").dp,
    md     = require("./md").md,
    _      = require("underscore");


var status = function(req, res, next) {
  var msg = "ssmp up & running";
  res.send({message: msg});
  req.log.info({ok: true}, msg);

};
exports.status = status;

var getmd = function(req, res, next) {

  var id    = req.params.id;
  var doc   = md.get(id);

  if(doc){
    var msg = "mpdoc " + id + " send",
        ro  = {ok: true};
    req.log.info(ro, msg);
    res.send(doc);
  }else{
    var msg = "mpdoc " + id + " not found",
    ro = {error:msg};

    req.log.error(ro, msg);
    res.send(ro);
  }
};
exports.getmd = getmd;

var setmd = function(req, res, next) {

  var mpdoc = req.params.doc;
  var docid = req.body._id;

  if(mpdoc == docid){
    var msg = "set mp doc",
        ro  = {ok:true};
    md.set(req.body, function(){
      res.send(ro);
      req.log.info(ro,msg);
    });
  }else{
    var msg = "request url don't match docid",
        ro ={ok:false};
    res.send(ro);
    req.log.info(ro,msg);
  }
};
exports.setmd = setmd;



var getparam = function(req, res, next) {

  var group = req.params.group;
  var obj   = dp.getgroup(group);

  if(obj && _.isObject(obj)){
    var msg = "object " + group + " send",
        ro  = {ok: true};
    req.log.info(ro, msg);
    res.send(obj);
  }else{
    var msg = "mpdoc " + group + " not found",
    ro = {error:msg};

    req.log.error(ro, msg);
    res.send(ro);
  }
};
exports.getparam = getparam;


var setparam = function(req, res, next) {
  var group = req.params.group,
      obj   = req.body,
      msg   = "set group " + group,
      ro    = {ok:true};

  if(_.isObject(obj)){
    dp.setgroup(group, obj, function(){
      res.send(ro);
      req.log.info(ro,msg);
      next();
    });
  }
};
exports.setparam = setparam;

//    var db = nano("http://" +
//                  dp.get(database, server) + ":" +
//                  db.get(database, port)).use(db.get(database, name));
