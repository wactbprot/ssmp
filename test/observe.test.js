var assert   = require("assert")
  , _        = require("underscore")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , cstr     = deflt.ctrlStr
  , exchpath = ["test","exchange"]
  , exobj    = {a:{b:{c:"test_val"}},
                d:{e:{f:"test_val"}}}
  , mem
  , observe
  , ds

describe('observe', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           mem.set(exchpath, exobj, function(err){
             observe    = require("../lib/observe");
             done();
           });
         });
  });

  after(function(done){
    ds.destroy();
    done();
  });

  describe('#ini()', function(){
    it('should start', function(done){
      observe.ini(function(res){
        assert.equal(res.ok, true);
        done();
      });
    });
  });

  describe('#stop_cont()', function(){
    it('should return error (path)', function(done){
      observe.stop_cont([], "", {}, function(err, path){
        assert.equal(err, "no or wrong path");
        done();
      });
    });

    it('should return error (timerId)', function(done){
      observe.stop_cont(["test", 0], "stop_container_obs", {}, function(err, path){
        assert.equal(err, "no or wrong timerId object");
        done();
      });
    });

    it('should return error (channel)', function(done){
      observe.stop_cont(["test", 0], "wrong", {test:{0:"test"}}, function(err, path){
        assert.equal(err, "wrong channel");
        done();
      });
    });

  });

});