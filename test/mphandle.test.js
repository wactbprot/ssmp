var assert   = require("assert")
  , _        = require("underscore")
  , broker    = require("sc-broker")
  , conf     = require("../lib/conf")
  , cstr     = conf.ctrlStr
  , exchpath = ["test","exchange"]
  , exobj    = {a:{b:{c:"test_val"}},
                d:{e:{f:"test_val"}}}
  , mem
  , mphandle
  , ds

describe('mphandle', function(){
  before(function(done){
    mem  = broker.createClient({port: conf.mem.port});
    mem.set(exchpath, exobj, function(err){
      mphandle    = require("../lib/mphandle");
      done();
    });
  });

  describe('#ini()', function(){
    it('should start', function(done){
      mphandle.ini(function(err, res){
        assert.equal(err, null);
        done();
      });
    });
  });

  describe('getmp#()', function(){

    it('should return error on empty id', function(done){
      mphandle.getmp("", function(err, path){
        assert.equal(err.message, "wrong id");
        done();
      });
    });

    it('should return error on wrong id type', function(done){
      mphandle.getmp(true, function(err, path){
        assert.equal(err.message, "wrong id");
        done();
      });
    });

    it('should return error on missing doc', function(done){
      mphandle.getmp("test", function(err, path){
        assert.equal(err.message, "not_found");
        done();
      });
    });

  });

  describe('rmmp#()', function(){

    it('should return error on empty id', function(done){
      mphandle.rmmp("", function(err, path){
        assert.equal(err.message, "wrong id");
        done();
      });
    });

    it('should return error on wrong id type', function(done){
      mphandle.rmmp(true, function(err, path){
        assert.equal(err.message, "wrong id");
        done();
      });
    });

    it('should try to rm', function(done){
      mphandle.rmmp("test", function(err, path){
        assert.equal(err, null);
        done();
      });
    });
  });
});