var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    deflt    = require("./default"),
    request  = require("./request"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

var load = function(mp, no){
var mpname =  mp.name;

  mp.definition.get([no], function(def){


   
  }); // definition}
module.exports = load;