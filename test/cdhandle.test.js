var assert   = require("assert")
  , _        = require("underscore")
  , broker   = require("sc-broker")
  , conf     = require("../lib/conf")
  , cstr     = conf.ctrlStr
  , exchpath = ["test","exchange"]
  , exobj    = {a:{b:{c:"test_val"}},
                d:{e:{f:"test_val"}}}
  , mem
  , cdhandle
  , ds

describe('cdhandle', function(){
  before(function(done){
    mem  = broker.createClient({port: conf.mem.port});
    mem.set(exchpath, exobj, function(err){
      cdhandle    = require("../lib/cdhandle");
      done();
    });
  });

  describe('#ini()', function(){
    it('should start', function(done){
      cdhandle.ini(function(err, res){
        assert.equal(err, null);
        done();
      });
    });
  });

  describe('#get_cd()', function(){

    it('should return error on empty id', function(done){
      cdhandle.get_cd("", "", function(err, path){
        assert.equal(err.message, "wrong mpid or cdid");
        done();
      });
    });

    it('should return error on wrong id type', function(done){
      cdhandle.get_cd(true, true, function(err, path){

        assert.equal(err.message, "wrong mpid or cdid");
        done();
      });
    });

    it('should return error on missing doc', function(done){
      cdhandle.get_cd("test", "test", function(err, path){
        assert.equal(err.message, "not a Calibration");
        done();
      });
    });

  });

  describe('#rm_cd()', function(){

    it('should return error on empty id', function(done){
      cdhandle.rm_cd("","", function(err, path){
        assert.equal(err.message, "wrong mpid or cdid");
        done();
      });
    });

    it('should return error on wrong id type', function(done){
      cdhandle.rm_cd(true, true, function(err, path){
        assert.equal(err.message, "wrong mpid or cdid");
        done();
      });
    });

    it('should try to rm', function(done){
      cdhandle.rm_cd("test","wrong", function(err, path){
        assert.equal(err, null);
        done();
      });
    });

 });

});