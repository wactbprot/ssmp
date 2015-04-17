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

  describe('#fetch(path, subpath, pretask, cb)', function(){
    it('should return error on wrong task (str)', function(done){
      load.fetch("path", "subpath", "pretask",  function(err, path){
        assert.equal(err,"wrong task");
        done()
      })
    });

    it('should return error on wrong task (taskname)', function(done){
      load.fetch("path", "subpath", {},  function(err, path){
        assert.equal(err,"wrong task");
        done()
      })
    });

    it('should return error on wrong path', function(done){
      load.fetch("path", "subpath", {TaskName:"test"},  function(err, path){
        assert.equal(err,"wrong path");
        done()
      })
    });

    it('should return error on wrong path', function(done){
      load.fetch(["path"], "subpath", {TaskName:"test"},  function(err, path){
        assert.equal(err,"wrong path");
        done()
      })
    });

    it('should return error on wrong subpath', function(done){
      load.fetch(["path", 0], "subpath", {TaskName:"test"},  function(err, path){
        assert.equal(err,"wrong subpath");
        done()
      })
    });

    it('should return error on wrong subpath', function(done){
      load.fetch(["path", 0], ["subpath"], {TaskName:"test"},  function(err, path){
        assert.equal(err,"wrong subpath");
        done()
      })
    });

    it('should return error on missing task', function(done){
      load.fetch(["path", 0], [0,0], {TaskName:"test"},  function(err, path){
        assert.equal(err,"no task called: test found");
        done()
      })
    });

    it('should work with Common-wait', function(done){
      load.fetch(["path", 0], [0,0], {TaskName:"Common-wait"},  function(err, path){
        assert.equal(err, false);
        done()
      })
    });

  });
});