var assert = require("assert")
  , _      = require("underscore")
  , ndata    = require("ndata")
  , deflt  = require("../lib/default")
  , mem
  , ds
  , load
  , exchpath = ["test","exchange"]
  , exobj    = {a:{b:{c:"test_val"}},
                d:{e:{f:"test_val"}}};

describe('load', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           mem.set(exchpath, exobj, function(err){
             load    = require("../lib/load");
               done();
           });
         });
  });

  after(function(done){
    ds.destroy();
    done();
  });


  describe('#load(path)', function(){
    it('should give error on wrong path', function(done){
      load.load(["test"], function(err, path){
        assert.equal(err, "wrong path");
        done();
      });
    });


  });
});