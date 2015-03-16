var _        = require("underscore")
  , assert   = require("assert")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , load     = require("../lib/load")
  , worker
  , ds
  , mem
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
     "DefinitionClass": "test"
    }];

describe('worker', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           mem.set(path_a, 1, function(){
             mem.set(path_b, 3, function(){
               mem.set(path_def, def, function(){

                 worker    = require("../lib/worker")

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
      worker.select({DefinitionClass:"test", Path:["test", 0]}, function(res){
        console.log(res)
        //assert.equal()
        done();
      });
    });

  });
});