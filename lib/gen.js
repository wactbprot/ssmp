/**
* objdef ... object definition
* Es wird eine container mit getter
* und setter zur verfügung gestellt,
* der benutzt werden kann um sichere
* Objecte wie```params```, ```ids```,
* ```mps``` uvm. zu erzeugen.
*/

var _        = require("underscore"),
    clone    = require("clone"),
    defaults = require("./defaults").all,
    ds       = defaults.ctrlstr;

var mod = function(od){
  var def = od || {};

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
      cb();
    }
  };

  var norm = function(base, value){

    for(var i in base){
      if(_.isObject(base[i]) ||
         _.isArray(base[i])){
        norm(base[i], value);
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
        res = pull(def, _.clone(p))
      }else{
        res = def;
      }
      return res;
    },
    set:function(path, obj, cb){
      var p = clone(path);
      if(_.isArray(p)){
        push(def, p ,obj, cb);
      }
    },
    ini:function(value, cb){
      if(!(_.isObject(value) ||
           _.isArray(value))){
       var res = norm(def, value)
        if(res &&
           _.isFunction(cb)){
          cb();
        }
      }
    }
  };
};
exports.mod = mod;

var lift = function(base, struct, ini){
  var i,ret = {};
  for(i = 0; i < base.length; i++){
    if(typeof base[i][struct] === "undefined"){
      ret[i] = ini;
    }else{
      ret[i] = base[i][struct];
    }
  }
  return ret;
};
exports.lift = lift;


/**
 * walkes sequentialy over the recipe structure
 * and executes exec(mp, path)
 */
var swalk = function(mp, no, exec){
  if(_.isFunction(exec)){
    var state = mp.state.get([no]),
        seqN  = state.length;

    for(var seq = 0; seq < seqN; seq++){
      var seqElem = state[seq],
          parN    = seqElem.length;
      if(_.contains(seqElem, ds.readystr)){
        for(var par = 0; par < parN; par++){
          exec(mp, [no, seq, par]);
        }
        break;
      }
    }
  }
};
exports.swalk = swalk;

/**
 * checks the over all state of a container
 */
var check = function(mp, no){
  var gs     = ds.inistr, // global state
      cs     = ds.inistr, // current state
      ret    = ds.inistr,
      state  = mp.state.get([no]),
      seqN   = state.length;

  for(var seq = 0; seq < seqN; seq++){
    var seqElem = state[seq],
        parN    = seqElem.length;
    for(var par = 0; par < parN; par++){
      cs = mp.state.get([no, seq, par]);
      if(gs === ds.inistr){
        gs = cs;
      }
      if(cs !== gs){
        ret = ds.workstr;
        break;
      }
    }
    if(ret !== ds.inistr){
      break;
    }
  }
  if(ret === ds.inistr){
    ret = gs;
  }
  return ret;
};
exports.check    = check;
