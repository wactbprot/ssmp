var assert = require("assert"),
    _      = require("underscore"),
    net    = require("../lib/net"),
    gen    = require("../lib/generic"),
    deflt  = require("../lib/default"),
    inimp  = require("../lib/ini_mp"),
    ctrlstr  = deflt.ctrlStr,
    mps    = {},
    req    = {}

req.params    = {};
req.params.id = "mp-waittest";
req.body      = "load";

describe('mp-waittest', function(){

    it('should ini the simulation definition', function(done){

      inimp(mps, req, function(ret){
        assert.equal(true, ret.ok);
        done();
      })
    })

})
