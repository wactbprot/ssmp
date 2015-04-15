var assert   = require("assert")
  , _        = require("underscore")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , cstr     = deflt.ctrlStr
  , exchpath = ["test","exchange"]
  , exobj    = {a:{b:{c:"test_val"}},
                d:{e:{f:"test_val"}}}
  , mem
  , cdhandle
  , ds

describe('cdhandle', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           mem.set(exchpath, exobj, function(err){
             cdhandle    = require("../lib/cdhandle");
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
      cdhandle.ini(function(res){
        assert.equal(res.ok, true);
        done();
      });
    });
  });

  describe('getcd#()', function(){

    it('should return error on empty id', function(done){
      cdhandle.getcd("", "", function(err, path){
        assert.equal(err, "wrong mpid or cdid");
        done();
      });
    });

    it('should return error on wrong id type', function(done){
      cdhandle.getcd(true, true, function(err, path){

        assert.equal(err, "wrong mpid or cdid");
        done();
      });
    });

    it('should return error on missing doc', function(done){
      cdhandle.getcd("test", "test", function(err, path){
        assert.equal(err, "not a Calibration");
        done();
      });
    });

  });

  describe('rmcd#()', function(){

    it('should return error on empty id', function(done){
      cdhandle.rmcd("","", function(err, path){
        assert.equal(err, "wrong mpid or cdid");
        done();
      });
    });

    it('should return error on wrong id type', function(done){
      cdhandle.rmcd(true, true, function(err, path){
        assert.equal(err, "wrong mpid or cdid");
        done();
      });
    });

    it('should try to rm', function(done){
      cdhandle.rmcd("test","wrong", function(err, path){
        assert.equal(err, false);
        done();
      });
    });

 });

});