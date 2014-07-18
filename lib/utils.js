var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    col     = require("./collections"),
    deflt    = require("./default"),
    gen      = require("./generic"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;



/**
 * wenn der cmdstr kann so aussieht
 *
 * load;run;stop
 *
 * soll das rauskommen:
 *
 * ["load","run", "stop"]
 *
 * wenn der cmdstr kann so aussieht
 *
 * load;2:run,stop
 *
 * soll das rauskommen:
 *
 * ["load","run", "stop","run", "stop"]
 *
 * ---> das schreit nun wirklich nach tests:
 *    http://jasmine.github.io/2.0/introduction.html
 */

var cmd_to_array = function(cmdstr){
  var arr = [],
      al1 = cmdstr.split(";");
  for(var i = 0; i < al1.length; i++){
    var al2 = al1[i].split(":");

    if(al2.length > 1){
      var rep    = parseInt(al2[0],10);

      if(typeof rep === "number"){
        for(var j = 0; j < rep; j++){
          _.map(al2[1].split(","), function(c){arr.push(c)});
        }
      }

    }else{
      arr.push(al1[i])
    }
  }
  if(_.isEmpty(arr)){
    arr.push(ctrlstr.ready);
  }
  return arr;
};
exports.cmd_to_array = cmd_to_array;

var replace_in_with = function(task, token, value){

  var strtask = JSON.stringify(task),
      patt    = new RegExp( token ,"g");

  if(Object.prototype.toString.call( value ) === '[object Array]'){
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
  var msg, ro, obj,
      id     = req.params.id,
      struct = req.params.struct;

  if(id        &&
     mps[id]){
    if(struct  &&
       mps[id][struct]){

      obj = mps[id][struct].get(get_path(req));
    }
    if(_.isUndefined(obj)){
      log.error({error: "object is undefined"}, "found nothing in the path");
       ro = {error: "given path contains nothing"}
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
    ro = {error: "no mp called " + id}
    log.error(ro, "maybe not initialized");
  }
  return ro;
}
exports.get = get;


var del = function(mps, req, cb){
  var msg, ro,
      id     = req.params.id,
      struct = req.params.struct;

  if(id            &&
     struct        &&
     mps[id]       &&
     mps[id][struct]){

    log.info({ok: true}, "try to delete");

    mps[id][struct].del(get_path(req), cb);

  }else{
    msg = "not a valid path";
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

  if(id            &&
     struct        &&
     mps[id]       &&
     mps[id][struct]){

    mps[id][struct].set(get_path(req), obj, cb);

  }else{
    msg = "not a valid path";
    ro = {error: msg};
    log.error(req, msg);
    cb(ro);
  }
};
exports.put = put;

/**
 * ```cdid``` speichert nicht nur
 * die id der Kalibrierdocumente
 * sondern besorgt auch noch einige
 * Infodaten über die entsprechnende
 * Kalibrierung, welche dann unter
 * dem key id aufbewahrt werden bzw.
 * abgefragt werden können
 *
 */
var get_cd_info = function(mps, req, cb){
    var msg, ro,
        id     = req.params.id,
        cdid   = req.params.cdid,
        cmd    = req.body;

  if(id            &&
     mps[id]       &&
     mps[id].id    &&
     cmd           &&
     cdid){

    if(cmd === "load"){
      var mp   = mps[id],
          opts = net.docinfo(mp, cdid);
      log.info({ok: true}, "try to add id: " + cdid   );

      net.dbcon(mp).relax(opts, function(err, info){
        if(_.isObject(info)){
          mp.id.set([cdid], info, cb)
        }
        if(err){
          log.error({error:"request failed"}, err)
        }
      });
    }

    }else{
      ro = {error: "not a valid path"};
      log.error(ro, "mp does not exist or no command given");
      cb(ro);
    }
};
exports.get_cd_info = get_cd_info;