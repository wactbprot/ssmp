var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , clone    = require('clone')
  , deflt    = require("./default")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: deflt.app.name + ".run.exchangeReplace"})
  , mem      = ndata.createClient({port: deflt.mem.port})
  , cstr     = deflt.ctrlStr
  , ro       = {ok:true}
  , err

/**
 * Frischt Task mit aktuelle exchange Werten auf.
 *
 * @method exchange_replace
 * @param {Array} path
 * @param {Object} task
 * @param {Boolean} ok
 * @param {String} cmdstr
 * @param {Function} cb
 */
module.exports = function (path, task, ok, cmdstr, cb){
  // --- Runtime data exchange
  if(task.FromExchange && _.isObject(task.FromExchange)){

    var exchtsk    = clone(task.FromExchange)
      , tokens = _.keys(exchtsk)
      , pathes = _.values(exchtsk);

    var N = tokens.length;
    for( var l = 0; l < N; l++){
      var path_l = pathes[l].split(".");

      mem.get(path.concat(path_l)
             , function (m, n){
                 return function (err, value){
                   if(!err){
                     if(!_.isUndefined(value)){
                       // der key in task.FromExchange
                       // muss erhalten bleiben;
                       // deshalb: raus:
                       delete task.FromExchange;
                       // ersetzen
                       task =  utils.replace_in_with(task, tokens[m] , value );
                       // wieder rein
                       task.FromExchange = exchtsk;
                     }else{
                       ok = false;
		       log.warn({warn: "undefined value"}
                               , "value for path " + pathes[m] + " is undefined");
		     }
                   }else{
                     log.error(err
                              , "can not read exchange at " + pathes[m]);
                   }
                   if(m == n - 1){
                     cb(task, ok, cmdstr);

                   }
                 }
               }(l, N)); // get exchange
    } // for
  }else{ // FromExchange object
    cb(task, ok, cmdstr);
  }
}
