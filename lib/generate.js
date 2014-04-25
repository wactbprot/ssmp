/**
 * objdef ... object definition
 * Es wird eine container mit getter
 * und setter zur verfügung gestellt,
 * der benutzt werden kann um sichere
 * Objecte wie```params```, ```ids```,
 * ```mps```  uvm. zu erzeugen.
 */

var _ = require("underscore");

exports.mod = function(od){
                    var objdef = od || {};

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

                    var push   = function( base, path, value, cbfn) {
                      var last = path.pop(), val;
                      try {
                        val = JSON.parse(value);
                      }catch(e){
                        val = value;
                      }
                      for( var i = 0; i < path.length; i++ ) {
                        base = base[ path[i] ] = base[ path[i] ] || {};
                      }
                      if(typeof val !== "undefined"){
                        base = base[ last ] = val;
                      }
                      if(_.isFunction(cbfn)){
                        cbfn();
                      }
                    };

                    return {
                      get:function(path){


                        var res;
                        if(_.isArray(path)){
                          res = pull(objdef, path)
                        }
                        return res;
                      },
                      set:function(path, obj, cbfn){
                        if(_.isArray(path)){
                          push(objdef, path, obj, cbfn);
                        }
                      }
                    };
};

exports.lift  = function(base, struct, ini){
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
