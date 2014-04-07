/**
 *
 * md ... measurement doc
 *
 * Todo: verallgemeinern so dass
 * auch die params und die id objekte
 * damit erzeugt werden
 */

var _ = require("underscore");

exports.md = (function(){
                var mpdef = {},
                    pull = function(path) {
                      var ret = mpdef;
                      for(var i = 0; i < path.length; i++) {
                        if(typeof ret[path[i]] === undefined){
                          ret = undefined;
                          break;
                        }else{
                          ret = ret[path[i]];
                        }
                      }
                      return ret;
                    };
                var push = function( base, path, value ) {
                  var lastName = arguments.length === 3 ? path.pop() : false;
                  for( var i = 0; i < path.length; i++ ) {
                    base = base[ path[i] ] = base[ path[i] ] || {};
                  }
                  if( lastName ) base = base[ lastName ] = eval(value);
                  return base;
                };

                return {
                  get:function(path){
                    var res;
                    if(_.isArray(path)){
                      res = pull(path)
                    }
                    return res;
                  },
                  set:function(path, obj, cbfn){

                    var id = path[0];
                    if( mpdef[id]){
                    }else{
                      mpdef[id] = {};
                    }
                    push(mpdef, path, obj);
                    if(_.isFunction(cbfn)){
                      cbfn();
                    }
                  }
                };
              })();