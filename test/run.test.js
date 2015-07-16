var assert   = require("assert")
, _        = require("underscore")
, ndata    = require("ndata")
, deflt    = require("../lib/default")
, cstr     = deflt.ctrlStr
, exchpath = ["test","exchange"]
, exobj    = {a:{b:{c:"test_val"}},
              d:{e:{f:"test_val"}},
	      g:{h:{i:0}},
              j:{k:{l:false}}}

, mem
, run
, ds

describe('run', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           mem.set(exchpath, exobj, function(err){
             run    = require("../lib/run");
             done();
           });
         });
  });

  after(function(done){
    ds.destroy();
    done();
  });

  describe('#stop_if()', function(){
    it('should pass params', function(done){
     run.stop_if([], {}, true, "test_cmd", function(t, o, c){
       assert.equal(_.isEmpty(t), true);
       assert.equal(o, true);
       assert.equal(c, "test_cmd");
        done();
      });
    });

    it('should emit ready on missing stopif path entry', function(done){
     run.stop_if([], {StopIf:"a.b.c"}, true, "test_cmd", function(t, o, c){
       assert.equal(o, true);
       assert.equal(c, cstr.ready);
       done();
      });
    });

  });

  describe('#run_if()', function(){
    it('should pass params', function(done){
     run.run_if([], {}, true, "test_cmd", function(t, o, c){
       assert.equal(_.isEmpty(t), true);
       assert.equal(o, true);
       assert.equal(c, "test_cmd");
        done();
      });
    });

    it('should emit ready on missing stopif path entry', function(done){
     run.run_if([], {RunIf:"a.b.c"}, true, "test_cmd", function(t, o, c){
       assert.equal(o, false);
       assert.equal(c, cstr.ready);
       done();
      });
    });

  });

  describe('#exchange_replace()', function(){
    it('should pass params', function(done){
     run.exchange_replace([], {}, true, "test_cmd", function(t, o, c){
       assert.equal(_.isEmpty(t), true);
       assert.equal(o, true);
       assert.equal(c, "test_cmd");
        done();
      });
    });

    it('should turn to false on missing exchange', function(done){
      var task = {FromExchange:{
        "@A":"a.b.c",
        "@B":"d.e.f"}};

      run.exchange_replace([], task, true, "test_cmd", function(t, o, c){
        assert.equal(o, false);
        assert.equal(c, "test_cmd");
        done();
      });
    });

    it('should replace and set true', function(done){
      var task = {A:"@A",
                  B:"@B",
                  FromExchange:{
                    "@A":"a.b.c",
                    "@B":"d.e.f"}}
        , path = ["test", "exchange"];

      run.exchange_replace(path, task, true, "test_cmd", function(t, o, c){
        assert.equal(_.isObject(t), true);
        assert.equal(t.A, "test_val");
        assert.equal(t.B, "test_val");
        assert.equal(o, true);
        assert.equal(c, "test_cmd");
        done();
      });
    });

      it('should replace boolean false values (0 and false --- !!) ', function(done){
      var task = {A:"@A",
                  B:"@B",
                  FromExchange:{
                    "@A":"g.h.i",
                    "@B":"j.k.l"}}
        , path = ["test", "exchange"];

      run.exchange_replace(path, task, true, "test_cmd", function(t, o, c){
        assert.equal(_.isObject(t), true);
        assert.equal(t.A, 0);
       assert.equal(t.B, "false");
        assert.equal(o, true);
        assert.equal(c, "test_cmd");
        done();
      });
    });
  });

  describe('#run()', function(){
    it('should start', function(){
     run.run(["test", 0], 0, 0, {Action:"wait"});
    });
  });

  describe('#ini()', function(){
    it('should start', function(done){
      run.ini(function(err, res){
        assert.equal(err, null);
        done();
      });
    });
  });

});
