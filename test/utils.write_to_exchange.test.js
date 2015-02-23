var _        = require("underscore")
  , assert   = require("assert")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , utils
  , ds
  , mem




describe('utils', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port})
           utils    = require("../lib/utils")
           done();
         });
  });

  after(function(done){
    ds.destroy();
    done();
  });

  describe('#write_to_exchange', function(){
    it('should write to exchange', function(done){
      var task   = {"ExchangePath": "test"}
        , value  = {"value":true}
        , path   = ["check"]

        utils.write_to_exchange(task, value , path, function(res){
          assert.equal(res.ok, true);
          done()
        });
    });
  });
});