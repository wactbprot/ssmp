var _        = require("underscore")
  , assert   = require("assert")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , utils
  , load
  , ds
  , mem

describe('load', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           utils    = require("../lib/utils");
           load     = require("../lib/load");
           done();
         });
  });

  after(function(done){
    ds.destroy();
    done();
  });

  describe('#ini()', function(){

    it('should start', function(done){
      load.ini(function(res){
        assert.equal(res.ok, true);
        done();
      });
    });
  });
});