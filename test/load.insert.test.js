var _        = require("underscore")
  , assert   = require("assert")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , load     = require("../lib/load")
  , utils
  , ds
  , mem

describe('load', function(){
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

  describe('#insert(def, calob, cb)', function(){

    it('should return erron on wrong definition (str)', function(done){
      load.insert("def", {}, function(err, res){
        assert.equal(err,"wrong definition");
        done();
      });
    });


    it('should return erron on wrong definition ([str])', function(done){
      load.insert(["def"], {}, function(err, res){
        assert.equal(err,"wrong definition");
        done();
      });
    });

    it('should return erron on wrong definition ([[str]])', function(done){
      load.insert(["def"], {}, function(err, res){
        assert.equal(err,"wrong definition");
        done();
      });
    });

    it('should add Id array', function(done){
      var def = [[{"TaskName":"A"},{"TaskName":"B"},{"TaskName":"C"}]]
      load.insert(def, {}, function(err, res){
        assert.equal(_.isArray(res[0][0].Id), true)
        assert.equal(_.isArray(res[0][1].Id), true)
        assert.equal(_.isArray(res[0][2].Id), true)
        done();
      });
    });


     it('should work with 3 parallel tasks at seq/position 0', function(done){
      var def = [[{"TaskName":"A"},{"TaskName":"B"},{"TaskName":"C"}]]
       load.insert(def, {}, function(err, res){
         assert.equal(res[0][0].TaskName, "A")
         assert.equal(res[0][1].TaskName, "B")
         assert.equal(res[0][2].TaskName, "C")
         done();
       });
     });

    it('should work with 3 parallel tasks at seq/position 1', function(done){
      var def = [[{"TaskName":"A"}],
                 [{"TaskName":"A"},{"TaskName":"B"},{"TaskName":"C"}]]
      load.insert(def, {}, function(err, res){
        assert.equal(res[1][0].TaskName, "A")
        assert.equal(res[1][1].TaskName, "B")
        assert.equal(res[1][2].TaskName, "C")
        done();
      });
    });

    it('should work with 3 parallel tasks at seq/position 2', function(done){
      var def = [[{"TaskName":"A"}],
                 [{"TaskName":"A"}],
                 [{"TaskName":"A"},{"TaskName":"B"},{"TaskName":"C"},{"TaskName":"D"}]]
      load.insert(def, {}, function(err, res){
        assert.equal(res[2][0].TaskName, "A")
        assert.equal(res[2][1].TaskName, "B")
        assert.equal(res[2][2].TaskName, "C")
        done();
      });
    });
  });
});
