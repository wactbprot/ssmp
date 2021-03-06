var _        = require("underscore")
  , bunyan   = require("bunyan")
  , fs       = require("fs")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , ret      = {}
  , log      = bunyan.createLogger({name: conf.app.name + ".utils.getJsn",
                                    streams: conf.log.streams
                                   });
/**
 * Stellt json als js-object bereit.
 *
 * @param {} path
 * @return ret
 */

module.exports = function(path){
  var ff = fs.readdirSync(path);
  if(ff && ff.length > 0){
    for(var i = 0; i < ff.length; i++){

      var cf    = ff[i],
          cpath = path + cf,
          cstat = fs.lstatSync(cpath),
          pat   = /\.json$/;

      if(cstat.isFile() && cf.search(pat) > -1){
        var jname   = cf.replace(pat, "") // z.B.: main
          , jsn    = JSON.parse(fs.readFileSync(cpath, "utf-8"));
        ret[jname] = jsn;
      }
    }
  }
  return ret;
}
