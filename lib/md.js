/**
 *
 * md ... measurement doc
 */

var _ = require("underscore");

exports.md = (function(){
                var mpdef = {},
                    pull = function(obj, path) {
                      var ret = obj;
                      for(var i = 0; i < path.length; i++) {
                        if(ret[path[i]]){
                          ret = ret[path[i]];
                        }else{
                          ret = undefined;
                          break;
                        }
                      }
                      return ret;
                    };

                return {
                  get:function(path){
                    var res;
                    if(_.isArray(path)){
                      res = pull(mpdef, path)

                    }
                    return res;
                  },
                  set:function(mp, cbfn){
                    var id = mp._id;
                    if(_.isObject(mp) && id ){
                      mpdef[id] = mp;
                    }
                    if(_.isFunction(cbfn)){
                      cbfn();
                    }
                  }
                };
              })();