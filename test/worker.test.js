var assert = require("assert")
  , _      = require("underscore")
  , worker  = require("../lib/worker")

describe('worker', function(){

  describe('#wait()', function(){
    it('should give an error message on missing WaitTime', function(done){
      worker.wait({}, function(res){
        assert.equal(res.error, "no waittime");
        done();
      });
    });

    it('should wait and call cb with ok', function(done){
      worker.wait({WaitTime:0}, function(res){
        assert.equal(res.ok, true);
        done();
      });
    });

  });
});