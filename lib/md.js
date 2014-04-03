/**
 *
 * md ... measurement doc
 */

var _ = require("underscore");

exports.md = (function(){
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