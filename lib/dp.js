/**
 *
 * dp ... data pool
 */
var _ = require("underscore");

var globals = (function(defaults){
                 var def = defaults;

                 return {
	           getgroup: function(group){
                     return def[group] | {};
	           },
	           setgtoup:function(group, object){
                     if(def[group] && _.isObject(object)){
                       def[group] = object;
                     }
	           },
	           getval : function(group, name){

	           },
	           setval : function(group, name, value){
	           }

                 }
               })(require("./defaults"));
