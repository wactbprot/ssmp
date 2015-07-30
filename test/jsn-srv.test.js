var srv    = require("../api/json-srv")
  , deflt  = require("../lib/default")
  , assert = require("assert")
  , _      = require("underscore")
  , ndata  = require("ndata")
  , mem
  , ds


describe('http-methods', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port})
           done();
         });
  });

  after(function(done){
    ds.destroy();
    done();
  });

  describe('#get_path(req)', function(){

    it('should return error object on missing params', function(done){
      var test = true
      srv(deflt, function(err, res){
        assert.equal(err,null);
        done();
      }, test);
    });
  });
});