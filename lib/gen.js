/**
* objdef ... object definition
* Es wird eine container mit getter
* und setter zur verfügung gestellt,
* der benutzt werden kann um sichere
* Objecte wie```params```, ```ids```,
* ```mps``` uvm. zu erzeugen.
*/

var _     = require("underscore"),
    clone = require("clone");

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

  var norm = function(base, value, cb){

    for(var i in base){
      if(_.isObject(base[i]) ||
         _.isArray(base[i])){
        norm(base[i], value, cb);
      }else{
        base[i] = value;
        if(_.isFunction(cb)){
          cb();
        }
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
        norm(def, value, cb)
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
