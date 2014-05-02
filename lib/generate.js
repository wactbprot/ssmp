/**
 * objdef ... object definition
 * Es wird eine container mit getter
 * und setter zur verfügung gestellt,
 * der benutzt werden kann um sichere
 * Objecte wie```params```, ```ids```,
 * ```mps```  uvm. zu erzeugen.
 */

var _ = require("underscore");

var mod = function(od){
  var def = od || {};

  var pull   = function(base, path) {
    for(var i = 0; i < path.length; i++) {
      if(typeof base[path[i]] === undefined){
        break;
      }else{
        base = base[path[i]];
      }
    }
    return base;
  };

  var push   = function( base, path, value, cb) {
    var last = path.pop();

    for( var i = 0; i < path.length; i++ ) {
      base = base[ path[i] ] = base[ path[i] ] || {};
    }
    if(typeof value !== "undefined"){
      base = base[ last ] = value;
    }
    if(_.isFunction(cb)){
      cb();
    }
  };

  return {
    get:function(path){
      var res;
      if(_.isArray(path)){
        res = pull(def, _.clone(path))
      }else{
        res = def;
      }
      return res;
    },
    set:function(path, obj, cb){
      if(_.isArray(path)){
        push(def, _.clone(path), obj, cb);
      }
    }
  };
};
exports.mod = mod;

var lift  = function(base, struct, ini){
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