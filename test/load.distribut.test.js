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
    it('should add Id array', function(done){
      load.distribute("path", "def", "meta",  function(res){
        done()
      })
    });
  });
});
