/**
 *
 * md ... measurement doc
 */

var _ = require("underscore");

exports.md = (function(){
		    var mpdef = {};
		    return {
			get:function(id, l1, l2){
                          var res;

                          if(id){
                            res = mpdef[id];
                            if(l1 && res){
                              res = res[l1];
                              if(l2 && res){
                                res = res[l2];
                              }
                            }
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