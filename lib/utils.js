var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    deflt    = require("./default"),
    gen      = require("./generic"),
    log      = bunyan.createLogger({name: deflt.appname});




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

var extract_mp = function(mp){
  var doc            = {};

  doc._id            = mp._id
  doc._rev           = mp._rev
  doc.Mp             = {};
  doc.Mp.Container   = [];

  doc.Mp.Name        = mp.name.get([]);
  doc.Mp.Description = mp.description.get([]);
  doc.Mp.Standard    = mp.standard;
  doc.Mp.Date        = mp.date;
  doc.Mp.Date.push({Type: "cloned",
                    Value: gen.vlDate()});

  doc.Mp.Exchange    = mp.exchange.get([]);
  doc.Mp.Recipes     = mp.recipes.get([]);
  doc.Mp.Tasks       = mp.tasks.get([]);

  for(var i = 0; i < mp.ctrl.get([]).length; i++){

    var cc = {};
    cc.Element     = mp.element.get([i]);
    cc.Recipe      = mp.recipe.get([i]);
    cc.Definition  = mp.definition.get([i]);
    cc.State       = mp.state.get([i]);
    cc.Title       = mp.title.get([i]);
    cc.Ctrl        = mp.ctrl.get([i]);
    cc.NoOfRepeats = mp.noOfRepeats.get([i]);

    doc.Mp.Container.push(cc);
  }
  return doc;
};
exports.extract_mp = extract_mp;

var get_frame = function(mps, req){
  var msg,
      ro   = {},
      id   = req.params.id,
      mp   = mps[id];

  ro.Title       = mp.title.get([]);
  ro.Name        = mp.name.get([]);
  ro.Description = mp.description.get([]);
  ro.Standard    = mp.standard;
  ro.Id          = id;
  return ro;
};
exports.get_frame = get_frame;

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
    }else{
      obj = extract_mp(mps[id]);
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