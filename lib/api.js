var _         = require("underscore"),
    gen       = require("./generate"),
    defaults  = require("./defaults");

/**
 * --*-- get --*--
 *
 * GET
 * http://server:port/mpid/mp
 * http://server:port/mpid/param/database
 *
 * Bsp.:
 *
 * http://localhost:8001/mpid/mp
 *
 * ```mpid``` ist die ```id``` des Messprogrammdokuments
 * bzw. der Messprogrammdefinition
 */
var get =  function(mps, req, cbfn){
  var path   = req.params[0].split("/"),
      id     = path.shift(),
      struct = path.shift(), // mp oder param ored id oder ...
      ro, msg;

  if(id            &&
     struct        &&
     mps           &&
     mps[id]       &&
     mps[id][struct]){

    var mp  = mps[id],
        obj = mp[struct].get(path);

    if(typeof obj === undefined){
      msg = "found nothing";
      ro  = {error:msg};

      req.log.error(ro, msg);

    }else{
      msg = "obj sent back";
      ro  = {result:obj};

      req.log.info(ro, msg);
    }
  }else{
    msg = "nothing in the path ";
    ro  = {error: msg};
    req.log.error(ro, msg);
  }

  if(_.isFunction(cbfn)){
    cbfn(ro)
  }
};
exports.get = get;

/**
 * --*-- set --*--
 *
 * SET
 * http://server:port/mpid/mp
 * http://server:port/mpid/param/database
 *
 * Bsp.:
 *
 * http://localhost:8001/mpid/mp
 *
 * ```mpid``` ist die ```id``` des Messprogrammdokuments
 * bzw. der Messprogrammdefinition
 */
var set =  function(mps, req, cbfn){

  var path   = req.params[0].split("/"),
      id     = path.shift(),
      struct = path.shift(),
      obj    = req.body,
      ro, msg;

  if(id            &&
     struct        &&
     mps           &&
     mps[id]       &&
     mps[id][struct]){

    var mp  = mps[id],
        res = mp[struct].set(path, obj);

    if(typeof res === "undefined"){
      msg = "found nothing";
      ro  = {error:msg};

      req.log.error(ro, msg);

    }else{
      msg = "obj sent back";
      ro  = {result: res};

      req.log.info(ro, msg);
    }
  }else{
    msg = "" + id + " not found";
    ro  = {error: msg};

    req.log.error(ro, msg);
  }

  if(_.isFunction(cbfn)){
    cbfn(ro)
  }
  return true;
};
exports.set = set;
/**
 * --*-- ini --*--
 *
 * POST
 * http://server:port/mpid/mp
 *
 * Bsp.:
 *
 * http://localhost:8001/mpid/mp
 *
 * ```mpid``` ist die ```id``` des Messprogrammdokuments
 * bzw. der Messprogrammdefinition im POST-Body
 */

var ini = function(mps, req, cbfn){
  var id    = req.params.id,
      docmp = req.body;

  if(typeof doc === "string"){
    docmp = JSON.parse(docmp);
    req.log.info(docmp, "parsed from string");
  }

  var doc = docmp.Mp

  if(mps.hasOwnProperty(id)){
    var msg =  "already initialized",
        ro = {error: msg};

    req.log.error(ro, msg);
  }else{
    var element = gen.lift(doc.Container, "Element")
    var recipe  = gen.lift(doc.Container, "Recipe")
    var title   = gen.lift(doc.Container, "Title")
    var go      = gen.lift(doc.Container, "Go")

    mps[id]           = {};

    mps[id].element   = gen.mod(element);
    mps[id].recipe    = gen.mod(recipe);
    mps[id].title     = gen.mod(title);
    mps[id].go        = gen.mod(go);

    mps[id].id        = gen.mod();
    mps[id].param     = gen.mod(defaults.all);

    var msg =  "ini complete",
        ro  = {ok: true};

    req.log.info(mps[id], msg);
  }

  if(_.isFunction(cbfn)){
    cbfn(mps[id]);
  }
  return true;
}
exports.ini = ini;
