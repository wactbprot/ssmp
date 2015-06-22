var _         = require("underscore")
  , fs        = require("fs")
  , h         = require("handlebars")
  , fpath     = "./info/templates/"
  , templates = function(){

      var ff = fs.readdirSync(fpath)
        , hc = {};

      for(var i = 0; i < ff.length; i++){
        var cf    = ff[i],
            cpath = fpath + cf,
            cstat = fs.lstatSync(cpath),
            pat   = /\.html$/;

        if(cstat.isFile() && cf.search(pat) > -1){
          var tmplname   = cf.replace(pat, ""), // z.B.: main
              tmplstring = fs.readFileSync(cpath, "utf-8")
          hc[tmplname] = h.compile(tmplstring);
        }
      }
      return hc;
    }
module.exports = templates();
