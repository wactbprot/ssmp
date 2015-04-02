var assert   = require("assert")
  , _        = require("underscore")
  , ndata    = require("ndata")
  , worker   = require("../lib/worker")
  , deflt    = require("../lib/default")
  , exchpath = ["test","exchange"]
  , mem
  , ds

describe('worker', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           mem.set(exchpath.concat(["a"])
                  , {Value:
                     {value:"ok"},
                     Ready:{value:"true"}}
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
                                 mem.set(exchpath.concat(["c"])
                                        , {Wrong:
                                           {value:"nope"}}
                                        , function(){
                                            mem.set(exchpath.concat(["d"])
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
        mem.get(["test", "exchange","d", "Ready", "value"], function(err, res){
          assert.equal(res, false);
          mem.set(["test", "exchange","d", "Ready", "value"], true, function(err){
            mem.get(["test", "exchange","d", "Ready", "value"], function(err, res){
              assert.equal(res, true);
              worker.readExchange({Key:"d", Path:["test", 0]}, function(res){
                mem.get(["test", "exchange","d", "Ready", "value"], function(err, res){
                assert.equal(res, false);
                  done();
                });
              });
            });
          });
        });
      });
    });
  });

  describe('#writeExchange(task, cb)', function(){

    it('should fail on missing key', function(done){
      worker.writeExchange({Path:["test",0], Value:true}, function(res){
        assert.equal(res.error, "not a valid task");
        done();
      });
    });


    it('should fail on missing Value', function(done){
      worker.writeExchange({Path:["test",0], Key:"a.b.c"}, function(res){
        assert.equal(res.error, "not a valid task");
        done();
      });
    });

    it('should fail on object key', function(done){
      worker.writeExchange({Path:["test",0], Key:{a:1}}, function(res){
        assert.equal(res.error, "not a valid task");
        done();
      });
    });

    it('should write to exchange', function(done){
      worker.writeExchange({Path:["test", 0], Key:"a.b.c", Value:"test"}, function(res){
        assert.equal(res.ok, true);
        mem.get(["test", "exchange","a", "b", "c"], function(err, res){
          assert.equal(res, "test");
          done();
        });
      });
    });
  });


  describe('#wait()', function(){

    it('should wait 10ms on missing WaitTime', function(done){
      worker.wait({WaitTime:10}, function(res){
        assert.equal(res.ok, true);
        done();
      });
    });

    it('should wait and call cb with ok', function(done){
      worker.wait({WaitTime:0}, function(res){
        assert.equal(res.ok, true);
        done();
      });
    });

    it('should return an error', function(done){
      worker.wait({WaitTime:"kk"}, function(res){
        assert.equal(res.error, "not a number");
        done();
      });
    });
  });

  describe('#getTime()', function(){
    it('should give error on missing task.DocPath', function(done){
      worker.getTime({}, function(res){
        assert.equal(res.error, "missing docpath");
        done();
      });
    });

    it('should try to save time', function(done){
      worker.getTime({DocPath:"a.b.c"}, function(res){
        assert.equal(res.ok, true);
        assert.equal(res.warn, "empty Id array");
        done();
      });
    });
  });

  describe('#getDate()', function(){
    it('should give error on missing task.DocPath', function(done){
      worker.getDate({}, function(res){
        assert.equal(res.error, "missing docpath");
        done();
      });
    });

    it('should try to save  date', function(done){
      worker.getDate({DocPath:"a.b.c"}, function(res){
        assert.equal(res.ok, true);
        assert.equal(res.warn, "empty Id array");
        done();
      });
    });
  });

  describe('#readExchange(task, cb)', function(){
    it('should fail on empty path', function(done){
      worker.checkRelay({}, function(res){
        assert.equal(res.error, "unvalid task");
        done();
      });
    });

    it('should fail on empty path', function(done){
      worker.checkRelay({Path:["test", 0], ExchangePath:"a.c.d"}, function(res){
        assert.equal(res.ok, true);
        done();
      });
    });

  });

});