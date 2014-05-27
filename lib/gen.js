/**
 * generische Funktionen
 * zum Organisieren der codes
 * wie
 * - mod erzeugt closure modules
 * - lift
 * - walk
 * - check
 */
var _        = require("underscore"),
    bunyan   = require("bunyan"),
    clone    = require("clone"),
    defaults = require("./defaults"),
    log      = bunyan.createLogger({name: defaults.appname}),
    ds       = defaults.statstr;

/**
 * ```mod``` ist closure die das object
 * ```def``` closed.
 * Auf dem Objekt werden  ```getter```
 * und ```setter``` zur Verfügung gestellt,
 * die benutzt werden können um sichere
 * Objekte wie```params```, ```ids```,
 * ```mps``` uvm. zu erzeugen. Das
 * Zugriffsmuster ist dann z.B.
 *
 * ```var mpSystemHeartbeat = mp.param.get(["system", "heartbeat"])```
 *
 * oder
 *
 * ```mp.param.set(["system", "heartbeat"], 1000)```
 *
 * oder
 *
 * ```mp.ctrl.ini([], "foo")```
 */

var mod = function(o){
  var def = o || {};

  var pull = function(base, p) {
    for(var i = 0; i < p.length; i++) {
      if(_.isUndefined(base[p[i]])){
        break;
      }else{
        base = base[p[i]];
      }
    }
    return base;
  };

  var push = function( base, p, value, cb) {
    var last = p.pop();
    for( var i = 0; i < p.length; i++ ) {
      base = base[ p[i] ] = base[ p[i] ] || {};
    }
    if(!_.isUndefined(value)){
      base = base[ last ] = value;
    }
    if(_.isFunction(cb)){
      cb({ok:true});
    }
  };

  var rm = function( base, p, cb) {
    var last = p.pop();
    for( var i = 0; i < p.length; i++ ) {
      base = base[ p[i] ];
    }
    if(base[ last ]){
      delete base[ last ];
      if(_.isFunction(cb)){
        cb({ok:true});
      }
    }else{
      if(_.isFunction(cb)){
        cb({error:"not found"});
      }
    }
  };

  var norm = function(base, value, lvl){
    for(var i in base){
      if( lvl > 0 &&
          (_.isObject(base[i]) || _.isArray(base[i]))){

        norm(base[i], value, lvl - 1);

      }else{
        base[i] = value;
      }
    }
    return base;
  };

  return {
    get:function(path){
      var res,
      p = clone(path);

      if(_.isArray(p)){
        res = pull(def, p);
      }else{
        res = def;
      }
      return res;
    },
    set:function(path, obj, cb){
      var p = clone(path);
      if(_.isArray(p)){
        push(def, p, obj, cb);
      }
    },
    del:function(path, cb){
      var p = clone(path);
      if(_.isArray(p)){
        rm(def, p, cb);
      }
    },
    ini:function(path, value, lvl, cb){
      var p = clone(path),
          ret;
      if(!(_.isObject(value) ||
           _.isArray(value)) &&
         _.isArray(p)){

        if(_.isEmpty(p)){
          ret = norm(def, value, lvl)
        }else{
          ret = norm(pull(def, p), value, lvl)
        }

        if(_.isFunction(cb)){
          if(_.isUndefined(ret)){
            cb({error:"undefined return value"});
          }else{
            cb({ok:true});
          }
        }
      }else{
        cb({error:"value is a obj or path is not a array"});
      }
    }
  };
};
exports.mod = mod;

var lift = function(base, struct, ini){
  var i,ret = {};
  if(_.isArray(base)){
    for(i = 0; i < base.length; i++){
      if(_.isUndefined(base[i][struct])){
        ret[i] = ini;
      }else{
        ret[i] = base[i][struct];
      }
    }
  }else{
    log.error({error:"not an array"}, "function lift receives: " + base);
  }
    return ret;
};
exports.lift = lift;


/**
 * walkes sequentialy over the recipe structure
 * and executes exec(mp, path)
 */
var walk = function(mp, no, exec){

  if(_.isFunction(exec)){

    var state = mp.state.get([no]),
        seqN  = state.length;

    for(var seq = 0; seq < seqN; seq++){
      var seqElem = state[seq],
          parN    = seqElem.length;

      if(_.contains(seqElem, ds.work)){
        break;
      }
      if(_.contains(seqElem, ds.ready)){
        for(var par = 0; par < parN; par++){
          exec(mp, [no, seq, par]);
        }
        break;
      }
    }
 }else{
    log.error({error:"not a function"}, "function walk receives: " + exec)
  }
};
exports.walk = walk;

/**
 * checks the over all state of a container
 */
var check = function(mp, no){
  var gs     = ds.ini, // global state
      cs     = ds.ini, // current state
      ret    = ds.ini,
      state  = mp.state.get([no]),
      seqN   = state.length;

  for(var seq = 0; seq < seqN; seq++){
    var seqElem = state[seq],
        parN    = seqElem.length;
    for(var par = 0; par < parN; par++){
      cs = mp.state.get([no, seq, par]);
      if(gs === ds.ini){
        gs = cs;
      }
      if(cs !== gs){
        ret = ds.work;
        break;
      }
    }
    if(ret !== ds.ini){
      break;
    }
  }
  if(ret === ds.ini){
    ret = gs;
  }
  return ret;
};
exports.check = check;
