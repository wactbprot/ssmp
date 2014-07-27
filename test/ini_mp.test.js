var assert = require("assert"),
    _      = require("underscore"),
    bunyan   = require("bunyan"),
    net    = require("../lib/net"),
    gen    = require("../lib/generic"),
    deflt  = require("../lib/default"),
    inimp  = require("../lib/ini_mp"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr,
    mps    = {},
    req    = {}

req.params = {};
req.log    = log;
req.params.id = "simdef";
req.body      = "load"
describe('ini_mp', function(){

    it('should ini the simulation definition', function(){

      inimp(mps, req, function(ret){
        assert(true, ret.ok);
      })
    })

})
