/**
 * 
 * mpd ... der mp doc handler
 */
var _ = require("underscore");

exports.mpdc = (function(){
		    var container = {};
		    return {
			get:function(id){
			    return container[id]; 
			},
			set:function(mp, cbfn){
			    var id = mp._id;
			    if(_.isObject(mp) && id ){
				container[id] = mp;
			    }
			    if(_.isFunction(cbfn)){
				cbfn();
			    }
			}
		    };
		})();