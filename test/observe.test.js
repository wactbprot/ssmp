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

  describe('#dispatch()', function(){
    it('should return error', function(done){
      observe.dispatch(["test", 0], "", "", function(err, path){
        console.log(err)
        console.log(path)

        //        assert.equal(res.ok, true);
        done();
      });
    });

    it('should return error', function(done){
      observe.dispatch([], "", "", function(err, path){
        assert.equal(err, "wrong path");
        done();
      });
    });

  });


  describe('#time_to_exchange()', function(){
    it('should return error', function(done){
      observe.time_to_exchange([], false, function(err, path){
        assert.equal(err, "wrong path");
        done();
      });
    });

    it('should work with true', function(done){
      observe.time_to_exchange(["test"], true, function(err, path){
        assert.equal(err, false);
        done();
      });
    });

    it('should work with false', function(done){
      observe.time_to_exchange(["test"], false, function(err, path){
        assert.equal(err, false);
        done();
      });
    });

  });

  describe('#shout()', function(){
    it('should work with no newstr', function(done){
      observe.shout(["test", 0],"","","",function(err, path){
        assert.equal(err, false);
        assert.equal(path[0],"test");
        done();
      });
    });

    it('should work with  newstr', function(done){
      observe.shout(["test", 0],"","", "new", function(err, path){
        assert.equal(err, false);
        assert.equal(path[0],"test");
        done();
      });
    });

    it('should return error', function(done){
      observe.shout([],"","","",function(err, path){
        assert.equal(err, "wrong path");
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

    it('should work for one container', function(done){
      observe.stop_cont(["test", 0], "stop_container_obs", {test:{0:"test"}}, function(err, path){
        assert.equal(err, false);
        assert.equal(path[0], "test");
        done();
      });
    });

    it('should work for all containers', function(done){
      observe.stop_cont(["test", 0], "stop_all_container_obs", {test:{0:"test"}}, function(err, path){
        assert.equal(err, false);
        assert.equal(path[0], "test");
        done();
      });
    });

  });

  describe('#cmd_to_array()', function(){
    it('should return an array containing the given string', function(){
      var  r   = "run";
      assert.equal(true, _.isArray(observe.cmd_to_array(r)));
      assert.equal(r, observe.cmd_to_array(r)[0]);
      assert.equal(1, observe.cmd_to_array(r).length);
    })
    it('should return an array containing the given string', function(){
      var  r   = "mon";
      assert.equal(true, _.isArray(observe.cmd_to_array(r)));
      assert.equal(r, observe.cmd_to_array(r)[0]);
      assert.equal(1, observe.cmd_to_array(r).length);
    })
    it('should return an array of length 2', function(){
      var l   = "load",
          r   = "run",
          lr  = "load;run";
      assert.equal(true, _.isArray(observe.cmd_to_array(lr)));
      assert.equal(l, observe.cmd_to_array(lr)[0]);
      assert.equal(r, observe.cmd_to_array(lr)[1]);
      assert.equal(2, observe.cmd_to_array(lr).length);
    })
    it('should return an array of length 3', function(){
      var l   = "load",
          r   = "run",
          lrr  = "load;2:run";
      assert.equal(true, _.isArray(observe.cmd_to_array(lrr)));
      assert.equal(l, observe.cmd_to_array(lrr)[0]);
      assert.equal(r, observe.cmd_to_array(lrr)[1]);
      assert.equal(r, observe.cmd_to_array(lrr)[2]);
      assert.equal(3, observe.cmd_to_array(lrr).length);
    })
    it('should return an empty string at position 0', function(){
      assert.equal(true, _.isArray(observe.cmd_to_array("")));
      assert.equal("", observe.cmd_to_array("")[0]);
    })
  })

});