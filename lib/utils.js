var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , ndata    = require('ndata')
  , ok       = {ok:true}, err
  , conf     = require("./conf");

/**
 * Description
 * @method pad0
 * @param {Number} n
 * @return ConditionalExpression
 */
var pad0 = function (n){
  return n < 10 ? "0" + n : n;
};

/**
 * Description
 * @method vl_date
 * @param {String} dstr
 * @return BinaryExpression
 */
var vl_date = function (dstr, shrt){
  var dt = dstr ? new Date(dstr) : new Date()
    , Y = dt.getFullYear()
    , M = pad0(dt.getMonth() + 1)
    , D = pad0(dt.getDate())
  if(shrt){
    return Y + '-' + M + '-' + D
  }else {
    var h = pad0(dt.getHours())
      , m = pad0(dt.getMinutes());

    return Y + '-' + M + '-' + D + " " + h+":" + m;
  }
};
exports.vl_date = vl_date;

/**
 * Description
 * @method vl_time
 * @param {String} dstr
 * @return BinaryExpression
 */
var vl_time = function (dstr){
  var dt = dstr ? new Date(dstr) : new Date();
  return "" + dt.getTime();
};
exports.vl_time = vl_time;

/**
 * Macht aus dem geschachtelten State Object ein
 * flaches Array
 * @method as_arr
 * @param {Object} o state array
 */
var as_arr = function (o){
  if(_.isObject(o) && _.isObject(o['0'])){
    return _.flatten(_.map(o, function (v, k){
                       return _.map(v,function (vv, kk){
                                return vv})
                     }));
  }else{
    return false;
  }
};
exports.as_arr = as_arr;

/**
 * Gibt true zurück, wenn
 * alle Array Elemente val sind sonst false
 * @method all_same
 * @param {} arr
 * @param {} val
 */
var all_same =  function (arr, val){
  if(_.isArray(arr) && _.isString(val)){
    return  _.every(arr, function (i){
              return i == val;
            });
  }else{
    return false;
  }
}
exports.all_same = all_same;

/**
 * Die Funktion kopiert die Struktur ```template```
 * und erzeugt eine genauso strukturiertes
 * Objekt initialisiert
 * es mit ```inival``` und ruft ```cb``` damit auf
 *
 * @method cp
 * @param {Array} template Strukturvorlage
 * @param {String} inival Inertialer Wert
 * @param {Function} cb callback Funktion
 */
var cp = function (template, inival, cb){
  if(template && _.isObject(template)){
    var k = _.keys(template)
      , iN = k.length
      , res = {};

    for(var i = 0; i < iN; i++){
      var e =  template[k[i]]
      if(e && _.isObject(e)){
        var kk = _.keys(e)
          , jN = kk.length;
        res[k[i]] = {};

        for(var j = 0; j < jN; j++){
          res[k[i]][kk[j]] = inival;
          if(i == iN -1 && j == jN -1 && _.isFunction(cb)){
            cb(null, res);
          }
        }
      }else{
        if(_.isFunction(cb)){
          err = new Error("template undefined");
          cb(err);
        }
      }
    }
  }else{
    if(_.isFunction(cb)){
      err = new Error("wrong template");
      cb(err);
    }
  }
};
exports.cp = cp;

/**
 * Ersetzt in task token mit value
 * @method replace_in_with
 * @param {Object} inObject (z.B. Task)
 * @param {String} token   (z.B. @waittime)
 * @param {Array|String} value
 * @return task
 */
var replace_in_with = function (inObj, token, value){

  var strinObj = JSON.stringify(inObj),
      patt    = new RegExp( token ,"g");

  if(_.isArray(value) || _.isObject(value)){
    strinObj = strinObj.replace(patt, JSON.stringify(value))
               .replace(/\"\[/g, "\[")
               .replace(/\]\"/g, "\]")
               .replace(/\"\{/g, "\{")
               .replace(/\}\"/g, "\}");
  }

  if(_.isString(value) || _.isNumber(value)|| _.isBoolean(value)){
    strinObj  = strinObj.replace(patt, value);
  }

  strinObj  = strinObj.replace(/\r/g, "\\r");
  strinObj  = strinObj.replace(/\n/g, "\\n");

  return JSON.parse(strinObj);
}
exports.replace_in_with = replace_in_with;


/**
 * Ersetzt in task token mit value
 * @method replace_in_with
 * @param {Object} inObject
 * @param {Object} replObject
 * @param {Function} callback wird mit inObject aufgerufen
 */
var replace_all = function (inObj, replObj, cb){
  if(replObj && _.isObject(replObj)){
    var k  = _.keys(replObj)
      , v  = _.values(replObj)
      , Nk = k.length;
    for(var i = 0; i < Nk; i++){
      inObj = replace_in_with(inObj, k[i], v[i]);

      if(i == Nk -1){
        cb(inObj);
      }
    }
  }else{
    cb(inObj);
  }
}
exports.replace_all = replace_all;

/**
 * Log stream array
 * @method log_streams
 * @return log stream array
 */
exports.log_streams = [{
  stream: new logStrm('http://'
                     + conf.logdb.server
                     + ":"
                     + conf.logdb.port
                     + "/"
                     + conf.logdb.prefix
                     + "-"
                     + vl_date(false, true)),
  level: 'debug',
  type: 'raw'
},{
  level: 'trace',
  stream: process.stdout
}];

exports.data_to_doc           = require("./utils.dataToDoc");
exports.query_cd              = require("./utils.queryCd");
exports.write_to_exchange     = require("./utils.writeToExchange");
exports.get_jsn               = require("./utils.getJsn");
