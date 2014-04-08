/**
 *
 * md ... measurement doc
 *
 * Todo: verallgemeinern so dass
 * auch die params und die id objekte
 * damit erzeugt werden
 */

var _ = require("underscore");

exports.md = (function(od){

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
                var push   = function( base, path, value ) {
                  var last = path.pop();
                  for( var i = 0; i < path.length; i++ ) {
                    base = base[ path[i] ] = base[ path[i] ] || {};
                  }
                  if( last ){
                    base = base[ last ] = eval(value);
                  }

                  return base;
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
                      var id = path[0];
                      if( objdef[id]){
                      }else{
                        objdef[id] = {};
                      }
                      push(objdef, path, obj);
                    }
                    if(_.isFunction(cbfn)){
                      cbfn();
                    }
                  }
                };
              })();