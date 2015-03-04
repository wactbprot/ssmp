var _        = require("underscore")
  , assert   = require("assert")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , utils
  , ds
  , mem

describe('utils', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port})
           utils    = require("../lib/utils")
           done();
         });
  });

  after(function(done){
    ds.destroy();
    done();
  });

  describe('#load', function(){
   it('should work with 3 parallel tasks at seq/position 0', function(done){
 // insert function
  });
});
