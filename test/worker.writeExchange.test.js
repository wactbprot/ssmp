var _        = require("underscore")
  , assert   = require("assert")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , worker
  , ds
  , mem
  , exchpath   = ["test","exchange"];

describe('worker', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           worker    = require("../lib/worker")
           done();
         });
  });

  after(function(done){
    ds.destroy();
    done();
  });

  describe('#writeExchange(task, cb)', function(){

    it('should fail on missing key', function(done){
      worker.writeExchange({}, function(res){
        assert.equal(res.error, "not a valid task")
        done();
      });
    });
  });

});