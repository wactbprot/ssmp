var assert   = require("assert")
  , _        = require("underscore")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , cstr     = deflt.ctrlStr
  , exchpath = ["test","exchange"]
  , exobj    = {a:{b:{c:"test_val"}},
                d:{e:{f:"test_val"}}}
  , mem
  , build
  , ds

describe('build', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           mem.set(exchpath, exobj, function(err){
             build    = require("../lib/build");
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
      build.ini(function(res){
        assert.equal(res.ok, true);
        done();
      });
    });
  });


  describe('#load_mp()', function(){
    it('should return error on empty doc', function(done){
      build.load_mp({}, function(err, path){
        assert.equal(err, "unvalid mp document");
        done();
      });
    });

    it('should return error on missing mpid', function(done){
      build.load_mp({Mp:{}}, function(err, path){
        assert.equal(err, "unvalid mp document");
        done();
      });
    });

    it('should return error on  empty mpid', function(done){
      build.load_mp({_id:"", Mp:{}}, function(err, path){
        assert.equal(err, "unvalid mp document");
        done();
      });
    });

    it('should work on empty Mp doc', function(done){
      build.load_mp({_id:"test", Mp:{}}, function(err, path){
        assert.equal(path[0], "test");
        done();
      });
    });

    it('should work on empty Mp.Container doc', function(done){
      build.load_mp({_id:"test", Mp:{Container:[]}}, function(err, path){
        assert.equal(err, false);
        done();
      });
    });

    it('should ignore wrong container type', function(done){
      build.load_mp({_id:"test", Mp:{Container:"wrong"}}, function(err, path){
        assert.equal(err, false);
        done();
      });
    });

  it('should work on empty Mp.Container object', function(done){
      build.load_mp({_id:"test", Mp:{Container:[{}]}}, function(err, path){
        assert.equal(err, false);
        done();
      });
    });

    it('should return error on  empty mpid', function(done){
      build.load_mp({_id:"test", Mp:{Container:[{From:"wrong", Take:"wrong"}]}}, function(err, path){
        assert.equal(err, "container not found");
        done();
      });
    });

  });

});