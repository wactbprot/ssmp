var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    d        = require("./defaults"),
    log      = bunyan.createLogger({name: d.appname});


var receive = function(mp, task, jd){
  var data = JSON.parse(jd)

  if(_.isObject(data)){
    if(task.DocPath){
      save(mp, task, data)
    }
  }else{
    log.error({error:"parse data"}, "can not parse returned data")
  }
};
module.exports = receive;

var save = function(mp, task, data){

  if(data.Result            &&
     data.Result.length > 0 &&
     task.Id                &&
     task.Id.length > 0){

    var doc = net.doc(mp),
        Id  = task.Id;

    for(var i = 0; i < Id.length; i++){
      var id = Id[i];

      doc.get(id, function(error, doc){
        if(error){
          log.error({error:error}, "failed to load doc for saving data");
        }
        if(doc){
          console.log(doc)
          console.log("....................")
        }
      }); // get
    }// for
  } // Result & Id
};