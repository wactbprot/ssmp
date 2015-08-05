var _        = require("underscore")
  , assert   = require("assert")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , ds
  , mem
  , worker   = {}
  , path_a   = ["test","exchange", "a","Value","value"]
  , path_b   = ["test","exchange", "b","Value","value"]
  , path_def = ["test","definitions"]
  , val_a    = 1
  , val_b    = 3
  , def      = [
    {"Condition": [
      {
        "ExchangePath": "a.Value.value",
        "Methode": "lt",
        "Value": 3
      },{
        "ExchangePath": "b.Value.value",
        "Methode": "gt",
        "Value": 1
      }
    ],
     "Definition": [
       [{"TaskName": "Commons-wait"}]
     ],
     "DefinitionClass": "testOk"
    },
    {"Condition": [
      {
        "ExchangePath": "a.Value.value",
        "Methode": "nope",
        "Value": 3
      }
    ],
     "Definition": [
       [{"TaskName": "Commons-wait"}]
     ],
     "DefinitionClass": "testWrong"
    }
  ];

describe('worker', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           mem.set(path_a, 1, function(){
             mem.set(path_b, 3, function(){
               mem.set(path_def, def, function(){

                 worker.select = require("../lib/worker.select")

                 done();
               });
             });
           });
         });
  });

  after(function(done){
    ds.destroy();
    done();
  });

  describe('#select(task, cb)', function(){

    it('should find predefined value below path a ', function(done){
      mem.get(path_a, function(err,val){
        assert.equal(val, val_a)
        done();
      });
    });

    it('should find predefined value below path b ', function(done){
      mem.get(path_b, function(err,val){
        assert.equal(val, val_b)
        done();
      });
    });

    it('should select Definition', function(done){
      worker.select({DefinitionClass:"testOk", Path:["test", 0]}, function(err, res){
        assert.equal(res.end, true)
        done();
      });
    });

    it('should detect unvalid conditions', function(done){
      worker.select({DefinitionClass:"testWrong", Path:["test", 0]}, function(err, res){
        assert.equal(err.message,"unknown condition Methode")
        done();
      });
    });

    it('should return error on wrong path', function(done){
      worker.select({DefinitionClass:"testOk", Path:["wrong", 0]}, function(err, res){
        assert.equal(err.message,"missing or wrong definitions")
        done();
      });
    });


    it('should return error on missing definition class', function(done){
      worker.select({WrongClass:"testOk", Path:["test", 0]}, function(err, res){
        assert.equal(err.message, "wrong task")
        done();
      });
    });

    it('should return error on missing path', function(done){
      worker.select({DefinitionClass:"testOk"}, function(err, res){
        assert.equal(err.message, "wrong task")
        done();
      });
    });

  });
});