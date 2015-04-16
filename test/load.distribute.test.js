var _        = require("underscore")
  , assert   = require("assert")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , load
  , utils
  , ds
  , mem

describe('load', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port})
           utils    = require("../lib/utils")
           load     = require("../lib/load")
           done();
         });
  });

  after(function(done){
    ds.destroy();
    done();
  });

  describe('#distribut(def, calob, cb)', function(){
    it('should return error on wrong path', function(done){
      load.distribute("path", "def", "meta",  function(err, path){
        assert.equal(err,"wrong path or meta object");
        done()
      })
    });

    it('should return error on wrong meta', function(done){
      load.distribute(["test"], "def", "meta",  function(err, path){
        assert.equal(err, "wrong path or meta object");
        done()
      })
    });

    it('should return error on wrong meta', function(done){
      load.distribute(["test", 0], "def", "meta",  function(err, path){
        assert.equal(err, "wrong path or meta object");
        done()
      })
    });

    it('should return error on wrong def', function(done){
      load.distribute(["test", 0], "def", {},  function(err, path){
        assert.equal(err,"wrong definition");
        done()
      })
    });

    it('should return error on wrong def', function(done){
      load.distribute(["test", 0], [], {},  function(err, path){
        assert.equal(err,"wrong definition");
        done()
      })
    });

    it('should return error on wrong def', function(done){
      load.distribute(["test", 0], [[]], {},  function(err, path){
        assert.equal(err,"wrong definition");
        done()
      })
    });

    it('should ', function(done){
      load.distribute(["test", 0], [[{}]], {},  function(err, path){
        console.log(err)
       // assert.equal(err,"wrong definition");
        done()
      })
    });


  });
});
