var assert   = require("assert")
  , _        = require("underscore")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , cstr     = deflt.ctrlStr
  , exchpath = ["test","exchange"]
  , exobj    = {a:{b:{c:"test_val"}},
                d:{e:{f:"test_val"}}}
  , mem
  , mphandle
  , ds

describe('mphandle', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           mem.set(exchpath, exobj, function(err){
             mphandle    = require("../lib/mphandle");
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
      mphandle.ini(function(res){
        assert.equal(res.ok, true);
        done();
      });
    });
  });

  describe('getmp#()', function(){

    it('should return error on empty id', function(done){
      mphandle.getmp("", function(err, path){
        assert.equal(err, "wrong id");
        done();
      });
    });

    it('should return error on wrong id type', function(done){
      mphandle.getmp(true, function(err, path){
        assert.equal(err, "wrong id");
        done();
      });
    });

    it('should return error on missing doc', function(done){
      mphandle.getmp("test", function(err, path){
        assert.equal(err, "not a mpdoc");
        done();
      });
    });

  });

  describe('rmmp#()', function(){

    it('should return error on empty id', function(done){
      mphandle.rmmp("", function(err, path){
        assert.equal(err, "wrong id");
        done();
      });
    });

    it('should return error on wrong id type', function(done){
      mphandle.rmmp(true, function(err, path){
        assert.equal(err, "wrong id");
        done();
      });
    });

    it('should try to rm', function(done){
      mphandle.rmmp("test", function(err, path){
        assert.equal(err, false);
        done();
      });
    });

  });

});