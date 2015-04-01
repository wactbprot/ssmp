var _        = require("underscore")
  , assert   = require("assert")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , worker
  , ds
  , mem
  , exchpath   = ["test","exchange"];

describe('worker', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           mem.set(exchpath.concat(["a"])
                  , {Value:
                     {value:"ok"},
                     Ready:
                     {value:"true"}}
                  , function(){
                      mem.set(exchpath.concat(["b"])
                             , {Value:
                                {value:1,
                                 type:"number",
                                 save:true},
                                Unit:
                                {value:"mbar",
                                 save:true},
                                Ready:
                                {value:true}}
                             , function(){
                                 mem.set(exchpath.concat(["d"])
                                        , {Wrong:
                                           {value:"nope"}}
                                        , function(){
                                            mem.set(exchpath.concat(["c"])
                                                   , {Value:
                                                      {value:1,
                                                       save:true},
                                                      Ready:
                                                      {value:true}}
                                                   , function(){
                                                       worker    = require("../lib/worker")
                                                       done();
                                                     });
                                          });
                               });
                    });
         });
  });

  after(function(done){
    ds.destroy();
    done();
  });

  describe('#readExchange(task, cb)', function(){

    it('should fail on missing key', function(done){
      worker.readExchange({}, function(res){

        assert.equal(res.error, "not a valid task")
        done();
      });
    });

    it('should fail on wrong key', function(done){

      worker.readExchange({Key:"wrong", Path:["test", 0]}, function(res){
        assert.equal(res.error, "nothing below give key")
        done();
      });
    });

    it('should work without .save entries', function(done){

      worker.readExchange({Key:"a", Path:["test", 0]}, function(res){
        assert.equal(res.ok, true);
        done();
      });
    });

    it('should work with type:number', function(done){

      worker.readExchange({Key:"b", Path:["test", 0]}, function(res){
        assert.equal(res.ok, true);
        done();
      });
    });

    it('should work with missing Ready ', function(done){

      worker.readExchange({Key:"c", Path:["test", 0]}, function(res){
        assert.equal(res.ok, true);
        done();
      });
    });

    it('should reset Ready to false', function(done){

      worker.readExchange({Key:"d", Path:["test", 0]}, function(res){

        mem.get(["test", "exchange","d","Ready","value"], function(err, res){

          assert.equal(res, false);

        done();
        });
      });
    });


});

});
