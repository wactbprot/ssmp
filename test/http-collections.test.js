var assert = require("assert")
  , _      = require("underscore")
  , ndata  = require("ndata")
  , deflt  = require("../lib/default")
  , coll
  , mem
  , ds

describe('http-collections', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port})
           coll = require("../http-api/http-collections")
           done();
         });
  });

  after(function(done){
    ds.destroy();
    done();
  });

  describe('#get_mps(req)', function(){

    it('should return error object on missing params', function(done){
      coll.get_mps({}, function(res){
        assert.equal(res.warn,"no mp available");
        done();
      });
    })
  });
});