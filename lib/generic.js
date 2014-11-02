var _        = require("underscore"),
    bunyan   = require("bunyan"),
    obpa     = require("object-path"),
    clone    = require("clone"),
    deflt    = require("./default"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * ```mod``` ist closure die das Objekt
 * ```def``` closed.
 * Auf dem Objekt werden  ```getter```
 * und ```setter``` zur Verfügung gestellt,
 * die benutzt werden können um sichere
 * Objekte wie```params```, ```ids```,
 * ```mps``` uvm. zu erzeugen. Das
 * Zugriffsmuster ist dann z.B.
 *
 * ```
 *   mp.param.get(["system", "heartbeat"], function(mpSystemHeartbeat){
 *
 * })
 * ```
 *
 * oder
 *
 * ```
 * mp.param.set(["system", "heartbeat"], 1000, callback)
 * ```
 * @param {Object} obj Inertialobjekt
 */

var mod = function(obj){
  var def  = obj || {};
  return {
    ensure:function(p, o){
      obpa.ensureExists(def, p, o);
    },
    get:function(p, cb){
      var res;
      if(_.isArray(p) && _.isEmpty(p)){
        res = def;
      }else{
        res =  obpa.get(def, p);
      }

      if(_.isFunction(cb)){
        // clone very important in order to keep the origin definition
        cb(clone(res));
      }
    },
    set:function(p, obj, cb){
      obpa.set(def, p, obj);
      if(_.isFunction(cb)){
        if(_.isEqual(obpa.get(def, p), obj)){
          cb({ok:true})
        }else{
          cb({error:"set fails"})
        }
      }
    },
    del:function(p, cb){
      obpa.del(def, p);
      if(_.isFunction(cb)){
        cb({ok:true})
      }
    }
  }
};
exports.mod = mod;
