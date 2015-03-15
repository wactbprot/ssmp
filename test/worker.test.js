var assert = require("assert")
  , _      = require("underscore")
  , worker  = require("../lib/worker")

describe('worker', function(){

  describe('#wait()', function(){
    it('should wait 1s on missing WaitTime', function(done){
      worker.wait({}, function(res){
        assert.equal(res.ok, true);
        done();
      });
    });

    it('should wait and call cb with ok', function(done){
      worker.wait({WaitTime:0}, function(res){
        assert.equal(res.ok, true);
        done();
      });
    });

    it('should wait and call cb with ok', function(done){
      worker.wait({WaitTime:"kk"}, function(res){
        assert.equal(res.error, "not a number");
        done();
      });
    });
  });

  describe('#getTime()', function(){
    it('should give error on missing task.DocPath', function(done){
      worker.getTime({}, function(res){
        assert.equal(res.error, "missing docpath");
        done();
      });
    });

    it('should try to save time', function(done){
      worker.getTime({DocPath:"a.b.c"}, function(res){
        assert.equal(res.ok, true);
        assert.equal(res.warn, "empty Id array");
        done();
      });
    });
  });

  describe('#getDate()', function(){
    it('should give error on missing task.DocPath', function(done){
      worker.getDate({}, function(res){
        assert.equal(res.error, "missing docpath");
        done();
      });
    });

    it('should try to save  date', function(done){
      worker.getDate({DocPath:"a.b.c"}, function(res){
        assert.equal(res.ok, true);
        assert.equal(res.warn, "empty Id array");
        done();
      });
    });
  });

});