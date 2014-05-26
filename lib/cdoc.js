var nano = require("nano"),
    _    = require("underscore"),
    net  = require("./net");

/**
 * Tresor der Kalibrierdocument ids und Informationen
 *
 * Die Struktur des ist die Folgende:
 *
 * {
 * idaaaa:{cucoName: "foo",
 *        rev:1-xxx},
 * idbbbb:{cucoName: "foo",
 *        rev:1-yyy}

 *
 * }
 */
var cdid = function(mp){
  var iobj =  {};
  return {
    info:function(id, cb){
      // call show with given id and callback

      net.docinfopts
    },
    get:function(){
      var ret = [];
      for(var i in iobj){
        ret.push(i);
      }
      return ret;
    },
   // set:function(id, cb){
   //   iobj[id] = {};
   //   if(_.isFunction(cb)){
   //     cb({ok:true});
   //   }
   // },
   // del:function(id, cb){
   //   i = _.without(i, id);
   //   if(_.isFunction(cb)){
   //     cb({ok:true});
   //   }
   // },
   // rst:function(cb){
   //   i = [];
   //   if(_.isFunction(cb)){
   //     cb({ok:true});
   //   }
   // }
  }
}
exports.cdid = cdid;