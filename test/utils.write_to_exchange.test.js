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

    it('should answer with an error on missing data source', function(done){
      var task   = {}
        , data  = {}
        , path   = ["check"]
      utils.write_to_exchange(task, data , path, function(res){
        assert.equal(res.error, "no data src");
          done()
      });
    });

    it('should write to exchange if task has ExchangePath', function(done){
      var task   = {"ExchangePath": "test"}
        , data  = {"value":true}
        , path   = ["check"]
      utils.write_to_exchange(task, data , path, function(res){
        assert.equal(res.ok, true);
          done()
      });
    });

    it('should answer with data on empty path', function(done){
      var task   = {"ExchangePath": "test"}
        , data  = {ok:true}
        , path   = []
      utils.write_to_exchange(task, data , path, function(res){
        assert.equal(res.ok, true);
        done()
      });
    });

    it('should write to exchange if data has ToExchange key', function(done){
      var task   = {}
        , data  = {"ToExchange":{'TestDev.Type.value':'test',
                                  'TestDev.Value.value':123}}
        , path   = ["check"]
      utils.write_to_exchange(task, data , path, function(res){
        assert.equal(res.ok, true);
        mem.get(path.concat(["exchange", "TestDev","Type","value"]), function(err, res){
          assert.equal(res, "test");
          mem.get(path.concat(["exchange", "TestDev","Value","value"]), function(err, res){
            assert.equal(res, 123);
          done()
          });
        });
      });
    });


  });
});