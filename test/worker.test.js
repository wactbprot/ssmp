var assert   = require("assert")
  , _        = require("underscore")
  , ndata    = require("ndata")
  , worker   = require("../lib/worker")
  , conf    = require("../lib/conf")
  , exchpath = ["test","exchange"]
  , mem
  , ds

describe('worker', function(){
  before(function(done){
    ds = ndata.createServer({port: conf.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: conf.mem.port});
           mem.set(exchpath.concat(["a"]), {Value:"ok",
                                            Ready:"true"}
                  , function(){
                      mem.set(exchpath.concat(["b"]), {Value:1,
                                                       Unit:"mbar",
                                                       Ready:true}
                             , function(){
                                 mem.set(exchpath.concat(["c"]),{Wrong:"nope"}
                                        , function(){
                                            mem.set(exchpath.concat(["d"]), {Value:1,
                                                                             Ready:true}
                                                   , function(){
                                                       worker = require("../lib/worker")
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
      worker.readExchange({}, function(err, res){

        assert.equal(err.message, "not a valid task")
        done();
      });
    });

    it('should fail on wrong ExchangePath', function(done){

      worker.readExchange({ExchangePath:"wrong", Path:["test", 0]}, function(err, res){
        assert.equal(err.message, "nothing below give key")
        done();
      });
    });



  });

  describe('#writeExchange(task, cb)', function(){

    it('should fail on missing key', function(done){
      worker.writeExchange({Path:["test",0], Value:true}, function(err, res){
        assert.equal(err.message, "not a valid task");
        done();
      });
    });


    it('should fail on missing Value', function(done){
      worker.writeExchange({Path:["test",0], Key:"a.b.c"}, function(err, res){
        assert.equal(err.message, "not a valid task");
        done();
      });
    });

    it('should fail on object key', function(done){
      worker.writeExchange({Path:["test",0], Key:{a:1}}, function(err, res){
        assert.equal(err.message, "not a valid task");
        done();
      });
    });

    it('should write to exchange', function(done){
      worker.writeExchange({Path:["test", 0], ExchangePath:"a.b.c", Value:"test"}, function(err, res){
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
      worker.wait({WaitTime:10}, function(err, res){
        assert.equal(res.ok, true);
        done();
      });
    });

    it('should wait 1000ms on  missing WaitTime', function(done){
      worker.wait({}, function(err, res){
        assert.equal(res.ok, true);
        done();
      });
    });

    it('should wait and call cb with ok', function(done){
      worker.wait({WaitTime:0}, function(err, res){
        assert.equal(res.ok, true);
        done();
      });
    });

    it('should return an error', function(done){
      worker.wait({WaitTime:"kk"}, function(err, res){
        assert.equal(err.message, "not a number");
        done();
      });
    });
  });

  describe('#getTime()', function(){
    it('should give error on missing task.DocPath', function(done){
      worker.getTime({}, function(err, res){
        assert.equal(err.message, "missing value");
        done();
      });
    });

    it('should try to save time', function(done){
      worker.getTime({DocPath:"a.b.c"}, function(err, res){
        assert.equal(res.ok, true);
        assert.equal(res.warn, "empty Id array");
        done();
      });
    });
  });

  describe('#getDate()', function(){
    it('should give error on missing task.DocPath', function(done){
      worker.getDate({}, function(err, res){
        assert.equal(err.message, "missing value");
        done();
      });
    });

    it('should try to save  date', function(done){
      worker.getDate({DocPath:"a.b.c"}, function(err, res){
        assert.equal(res.ok, true);
        assert.equal(res.warn, "empty Id array");
        done();
      });
    });
  });

  describe('#checkRelay(task, cb)', function(){
    it('should fail on empty task', function(done){
      worker.checkRelay({}, function(err, res){
        assert.equal(err.message, "unvalid task");
        done();
      });
    });

    it('should return ok', function(done){
      worker.checkRelay({Path:["test", 0], ExchangePath:"a.c.d"}, function(err, res){
        if(!err){
          assert.equal(res.ok, true);
        }else{

        }
        done();
      });
    });

  });

  describe('#nodeRelay(task, cb)', function(){
    it('should fail on empty task', function(done){
      worker.nodeRelay({}, function(err, res){
        assert.equal(err.message, "wrong path");
        done();
      });
    });

    it('should return error', function(done){
      worker.nodeRelay({Path:["test", 0]}, function(err, res){
        if(!err){
          assert.equal(err.message, "action not found" );
        }else{

        }
        done();
      });
    });

  });

  describe('#getList(task, cb)', function(){
    it('should fail on empty task', function(done){
      worker.getList({}, function(err, res){
        assert.equal(err.message, "wrong path");
        done();
      });
    });

    it('should return error', function(done){
      worker.getList({Path:["test", 0], ExchangePath:"a.b.c"}, function(err, res){
        assert.equal(err.message,  "not_found");
        done();
      });
    });

  });

  describe('#checkDB()', function(){
    it('should fail on empty task', function(done){
      worker.checkDB({}, function(err, res){
        assert.equal(err.message, "wrong path");
        done();
      });
    });

    it('should return result object', function(done){
      worker.checkDB({Path:["test", 0], ExchangePath:"a.b.c"}, function(err, res){
        assert.equal(_.isObject(res), true);
        done();
      });
    });
  });

  describe('#updateCd()', function(){
    it('should fail on empty task', function(done){
      worker.updateCd({}, function(err, res){
        assert.equal(err.message, "unvalid task");
        done();
      });
    });

    it('should fail on empty task', function(done){
      worker.updateCd({Path:["test", 0]}, function(err, res){
        assert.equal(res.ok, true);
        done();
      });
    });

  });

  describe('#ctrlContainer()', function(){
    it('should fail on empty task', function(done){
      worker.ctrlContainer({}, function(err, res){
        assert.equal(err.message, "unvalid task");
        done();
      });
    });

  });
});
