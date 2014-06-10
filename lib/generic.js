/**
 * generische Funktionen
 * zum Organisieren der codes
 * wie
 * - mod erzeugt closure modules
 * - lift
 * - walk
 * - check
 */
var _        = require("underscore"),
    bunyan   = require("bunyan"),
    obpa     = require("object-path"),
    defaults = require("./default"),
    log      = bunyan.createLogger({name: defaults.appname}),
    ds       = defaults.statstr;

/**
 * ```mod``` ist closure die das object
 * ```def``` closed.
 * Auf dem Objekt werden  ```getter```
 * und ```setter``` zur Verfügung gestellt,
 * die benutzt werden können um sichere
 * Objekte wie```params```, ```ids```,
 * ```mps``` uvm. zu erzeugen. Das
 * Zugriffsmuster ist dann z.B.
 *
 * ```var mpSystemHeartbeat = mp.param.get(["system", "heartbeat"])```
 *
 * oder
 *
 * ```mp.param.set(["system", "heartbeat"], 1000)```
 *
 * oder
 *
 * ```mp.ctrl.ini([], "foo")```
 */

var mod = function(obj){
  var def  = obj || {},
      norm = function(base, value, lvl){
        for(var i in base){
          if( lvl > 0 &&
              (_.isObject(base[i]) || _.isArray(base[i]))){
            norm(base[i], value, lvl - 1);
          }else{
            base[i] = value;
          }
        }
        return base;
      };

  return {
    ensure:function(p, o){
      obpa.ensureExists(def, p, o);
    },
    get:function(p){
      var res;
      if(_.isArray(p) && _.isEmpty(p)){
        res = def;
      }else{
        res =  obpa.get(def, p);
      }
      return res;
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
    },
    ini:function(p, v, lvl, cb){
      var ret;
      if(!(_.isObject(v) ||
           _.isArray(v)) &&
         _.isArray(p)){
        if(_.isEmpty(p)){
          ret = norm(def, v, lvl)
        }else{
          ret = norm(obpa.get(def, p), v, lvl)
        }
        if(_.isFunction(cb)){
          if(_.isUndefined(ret)){
            cb({error:"undefined return value"});
          }else{
            cb({ok:true});
          }
        }
      }else{
        cb({error:"value is an object or path is not a array"});
      }
    }
  };
};
exports.mod = mod;

/**
 * Hebt ```struct``` aus ```base``` ein level nach
 * oben, damit die pfade nicht so lang werden
 */
var lift = function(base, struct, ini){
  var i,ret = {};
  if(_.isArray(base)){
    for(i = 0; i < base.length; i++){
      if(_.isUndefined(base[i][struct])){
        ret[i] = ini;
      }else{
        ret[i] = base[i][struct];
      }
    }
  }else{
    log.error({error:"not an array"}, "function lift receives: " + base);
  }
    return ret;
};
exports.lift = lift;


/**
 * Läuft in sequenzieller Weise
 * über die ```state``` Struktur
 * und führt sukzessive die Funktion
 * ```exec``` mit ```mp``` und ```path```
 * als parameter aus
 */
var walk = function(mp, no, exec){

  if(_.isFunction(exec)){

    var def   = mp.definition.get([no]),
        seqN  = def.length;

    for(var seq = 0; seq < seqN; seq++){
      var seqElem = def[seq],
          parN    = seqElem.length,
          seqstate =_.pluck(seqElem, "State");

      if( _.contains(seqstate, ds.work)){
        break;
      }
      if(_.contains(seqstate, ds.ready)){
        for(var par = 0; par < parN; par++){
          if(seqstate[par] === ds.ready){
            exec(mp, [no, seq, par]);
          }
        }
        break;
      }
    }
 }else{
    log.error({error:"not a function"}, "function walk receives: " + exec)
  }
};
exports.walk = walk;

/**
 * Kontrolliert den Zustand des Containers
 * Nummer ```no``` und fasst diesen in einem
 * String zusammen
 */
var checkState = function(mp, no){
  var gs     = ds.ini, // global state
      cs     = ds.ini, // current state
      ret    = ds.ini, // return state
      def    = mp.definition.get([no]),
      seqN   = def.length;

  for(var seq = 0; seq < seqN; seq++){
    var seqElem = def[seq],
        parN    = seqElem.length;
    for(var par = 0; par < parN; par++){

      cs = seqElem[par].State;
      if(_.isUndefined(cs)){
        iniState(mp, no);
        break;
      }
      if(gs === ds.ini){
        gs = cs;
      }
      if(cs !== gs){
        ret = ds.work;
        break;
      }
    }
    if(ret !== ds.ini){
      break;
    }
  }
  if(ret === ds.ini){
    ret = gs;
  }
  return ret;
};
exports.checkState = checkState;

var iniState = function(mp, no, val, cb){
  var d  = mp.definition.get([no]),
      v  = val || ds.ini,
      li = d.length;
  for(var i = 0; i < li; i++){
    var lj = d[i].length;
    for(var j = 0; j < lj; j++){
      mp.definition.set([no, i, j, "State"], v, function(){
        if(i === li -1 && j === lj-1 && _.isFunction(cb)){
          cb();
        }
      });
    }
  }
};
exports.iniState = iniState;