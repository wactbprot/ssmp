/**
 *
 * dp ... data pool
 */

var name = "ssmp",  
    _    = require("underscore"),
bunyan   = require('bunyan'),
log      = bunyan.createLogger({name:name});


exports.dp = (function(defaults){
                  var def = defaults;
                  return {
                      getgroup: function(group){
			  return def[group];
                      },
                      setgroup:function(group, object, cbfn){
                          if(_.isObject(object)){
                              def[group] = object;
                              log.info("object stored below " + group);
			  }
                          if(_.isFunction(cbfn)){
                              cbfn();
                          }
			  
                      },
                      getvalue : function(group, name){
                          var ret;

                          if(def[group]){
                              ret = def[group][name];
                          }
                          return ret;

                      },
                      setvalue : function(group, name, value, cbfn){
                          if(_.isFunction(cbfn)){
                              cbfn();
                          }
                      }
                  };
              })(require("./defaults"));
