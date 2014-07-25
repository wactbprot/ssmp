var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    col      = require("./collections"),
    deflt    = require("./default"),
    gen      = require("./generic"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * wenn der cmdstr kann so aussieht:
 * "load;run;stop"
 * soll das rauskommen:
 * ["load","run", "stop"]
 * wenn der cmdstr kann so aussieht:
 * "load;2:run,stop"
 * soll das rauskommen:
 * ["load","run", "stop","run", "stop"]
 */

var cmd_to_array = function(cmdstr){
  var arr = [],
      al1 = cmdstr.split(";");
  for(var i = 0; i < al1.length; i++){
    var al2 = al1[i].split(":");

    if(al2.length > 1){
      var rep    = parseInt(al2[0],10);
      if(_.isNumber(rep)){
        for(var j = 0; j < rep; j++){
          _.map(al2[1].split(","), function(c){arr.push(c)});
        }
      }
    }else{
      arr.push(al1[i]);
    }
  }
  return arr;
};
exports.cmd_to_array = cmd_to_array;

var replace_in_with = function(task, token, value){

  var strtask = JSON.stringify(task),
      patt    = new RegExp( token ,"g");

  if(_.isArray(value)){
    strtask = strtask.replace(patt, JSON.stringify(value))
              .replace(/\"\[/g, "\[")
              .replace(/\]\"/g, "\]")
  }else{
    strtask  = strtask.replace(patt, value);
  }
  strtask  = strtask.replace(/\n/g, "\\n");
  strtask  = strtask.replace(/\r/g, "\\r");

  return JSON.parse(strtask);
}
exports.replace_in_with = replace_in_with;

var get_path = function(req){
  var path = [],
      struct = req.params.struct,
      l1   = req.params.l1,
      l2   = req.params.l2,
      l3   = req.params.l3,
      msg  = "request to " + struct + "/";

  if(l3 && l2 && l1){
    log.info({ok: true}, msg + l1 + "/" + l2 + "/"+ l3 );
    path = [l1, l2, l3];
  }

  if(l2 && l1 && !l3){
    log.info({ok: true}, msg + l1 + "/" + l2 );
    path = [l1, l2];
  }

  if(l1 && !l2 && !l3){
    log.info({ok: true}, msg + l1 );
    path = [l1];
  }
  if(!l1 && !l2 && !l3){
    log.info({ok: true}, msg  );
  }
  return path;
}
exports.get_path = get_path;

var get = function(mps, req){
  var msg, ro, obj, path,
      id     = req.params.id,
      struct = req.params.struct;

  if(id        &&
     mps[id]){
    if(struct  &&
       mps[id][struct] &&
       _.isFunction(mps[id][struct].get)){

      obj  = mps[id][struct].get(get_path(req));
      if(_.isUndefined(obj)){
        ro = {error:"object is undefined"}
        log.error(ro,"found nothing in the path");
      }else{
          if(_.isObject(obj) || _.isArray(obj)){
            ro = obj;
            log.info({ok:true}, "sent object back");
          }else{
            ro  = {result:obj}
            log.info({ok:true}, "sent value back");
          };

      }
    }else{
      ro = {error: "undefined structure"};
      log.error(ro,"no such structure");
    }
  }else{
    ro = {error: "mpdef not found"}
    log.error(ro, "maybe not initialized");
  }
  return ro;
}
exports.get = get;

var del = function(mps, req, cb){
  var msg, ro, path,
      id     = req.params.id,
      struct = req.params.struct;

  if(id            &&
     struct        &&
     mps[id]       &&
     mps[id][struct]){

    path = get_path(req);

    if(_.isEmpty(path)){
      msg = "empty path";
      ro  = {error: msg};
      log.error(req, msg);

      cb(ro);

    }else{
      log.info({ok: true}, "try to delete");
      mps[id][struct].del(get_path(req), cb);
    }
  }else{
    msg = "not a valid structure";
    ro = {error: msg};
    log.error(req, msg);
    cb(ro);
  }
};
exports.del = del;

var put = function(mps, req, cb){
  var msg, ro, path, value,
      ok     = true,
      id     = req.params.id,
      struct = req.params.struct,
      obj    = req.body;

  if(_.isUndefined(obj) ||
     _.isFunction(obj)){

    ro  = {error: "object not valid"};
    log.error(req, "object must not be a function or undefined");

    cb(ro);

     }else{
       if(id            &&
          struct        &&
          mps[id]       &&
          mps[id][struct]){

         path = get_path(req);

         if(_.isEmpty(path)){
           msg = "empty path";
           ro  = {error: msg};
           log.error(req, msg);

           cb(ro);

         }else{
      log.info({ok: true}, "try to set");
           mps[id][struct].set(get_path(req), obj, cb);
         }
       }else{
         msg = "not a valid structure";
         ro  = {error: msg};
         log.error(req, msg);

         cb(ro);

       }
     }
};
exports.put = put;


var pad0 = function(n){
    return n < 10 ? "0" + n : n;
};

var vlDate = function(dstr){
    var dt = dstr ? new Date(dstr) : new Date(),
    Y = dt.getFullYear(),
    M = pad0(dt.getMonth() + 1),
    D = pad0(dt.getDate()),
    h = pad0(dt.getHours()),
    m = pad0(dt.getMinutes());
    return Y + '-' + M + '-' + D + " " + h+":" + m;
};
exports.vlDate = vlDate;

var vlTime = function(dstr){
  var dt = dstr ? new Date(dstr) : new Date();
  
  return "" + dt.getTime();
};
exports.vlTime = vlTime;
