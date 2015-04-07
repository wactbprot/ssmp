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

describe('run', function(){
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

});