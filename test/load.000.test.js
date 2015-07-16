var assert = require("assert")
  , _      = require("underscore")
  , ndata    = require("ndata")
  , deflt  = require("../lib/default")
  , mem
  , ds
  , load


describe('load', function(){
  before(function(done){
    ds = ndata.createServer({port: deflt.mem.port}).on('ready', function(){
           mem  = ndata.createClient({port: deflt.mem.port});
           load    = require("../lib/load");

           load.ini(function(){
             done();
           });
         });
  });

  after(function(done){
      ds.destroy();
      done();
  });


  describe('#ini()', function(){
    it('should start', function(done){
      load.ini(function(err, res){
        assert.equal(err, null);
        done();
      });
    });
  });

  describe('#distribut(def, calob, cb)', function(){
    it('should return error on wrong path', function(done){
      load.distribute("path", "def", "meta",  function(err, path){
        assert.equal(err.message,"wrong path or meta object");
        done()
      })
    });

    it('should return error on wrong meta', function(done){
      load.distribute(["test"], "def", "meta",  function(err, path){
        assert.equal(err.message, "wrong path or meta object");
        done()
      })
    });

    it('should return error on wrong meta', function(done){
      load.distribute(["test", 0], "def", "meta",  function(err, path){
        assert.equal(err.message, "wrong path or meta object");
        done()
      })
    });

    it('should return error on wrong def', function(done){
      load.distribute(["test", 0], "def", {},  function(err, path){
        assert.equal(err.message,"wrong definition");
        done()
      })
    });

    it('should return error on wrong def', function(done){
      load.distribute(["test", 0], [], {},  function(err, path){
        assert.equal(err.message,"wrong definition");
        done()
      })
    });

    it('should return error on wrong def', function(done){
      load.distribute(["test", 0], [[]], {},  function(err, path){
        assert.equal(err.message,"wrong definition");
        done()
      })
    });

    it('should work with Common-wait', function(done){
      load.distribute(["test", 0], [[{TaskName:"Common-wait"}]], {},  function(err, path){
        assert.equal(err, null);
        done()
      })
    });


  });

  describe('#fetch(path, subpath, pretask, cb)', function(){
    it('should return error on wrong task (str)', function(done){
      load.fetch("path", "subpath", "pretask",  function(err, path){
        assert.equal(err.message,"wrong task");
        done()
      })
    });

    it('should return error on wrong task (taskname)', function(done){
      load.fetch("path", "subpath", {},  function(err, path){
        assert.equal(err.message,"wrong task");
        done()
      })
    });

    it('should return error on wrong path', function(done){
      load.fetch("path", "subpath", {TaskName:"test"},  function(err, path){
        assert.equal(err.message,"wrong path");
        done()
      })
    });

    it('should return error on wrong path', function(done){
      load.fetch(["path"], "subpath", {TaskName:"test"},  function(err, path){
        assert.equal(err.message,"wrong path");
        done()
      })
    });

    it('should return error on wrong subpath', function(done){
      load.fetch(["path", 0], "subpath", {TaskName:"test"},  function(err, path){
        assert.equal(err.message,"wrong subpath");
        done()
      })
    });

    it('should return error on wrong subpath', function(done){
      load.fetch(["path", 0], ["subpath"], {TaskName:"test"},  function(err, path){
        assert.equal(err.message,"wrong subpath");
        done()
      })
    });

    it('should return error on missing task', function(done){
      load.fetch(["path", 0], [0,0], {TaskName:"test"},  function(err, path){
        assert.equal(err.message,"no task called: test found");
        done()
      })
    });

    it('should work with Common-wait', function(done){
      load.fetch(["path", 0], [0,0], {TaskName:"Common-wait"},  function(err, path){
        assert.equal(err, null);
        done()
      })
    });

  });

  describe('#load(path)', function(){
    it('should give error on wrong path', function(done){
      load.load(["test"], function(err, path){
        assert.equal(err.message, "wrong path");
        done();
      });
    });

    it('should give error on wrong path', function(done){
      mem.set(["test", 0, "definition"],[[{TaskName:"Common-wait"}]] , function(err){
        load.load(["test", 0], function(err, path){
          assert.equal(err.message, "wrong path or meta object");
          done();
        });
      });
    });

    it('should run with minimal setup', function(done){
      mem.set(["test", 0, "definition"],[[{TaskName:"Common-wait"}]] , function(err){
        mem.set(["test", "meta"], {standard:"", name:""} , function(err){
          load.load(["test", 0], function(err, path){
            assert.equal(err, null);
            done();
          });
        });
      });
    });

    it('should set recipe', function(done){
      mem.set(["test", 0, "definition"]
             ,[
               [
                 {TaskName:"Common-wait"}
               ]
             ], function(err){
                  mem.set(["test", "meta"], {standard:"", name:""} , function(err){
                    load.load(["test", 0], function(err, path){
                      mem.get(["test", 0, "recipe"] , function(err, dat){
                        assert.equal(_.isObject(dat[0]), true);
                        assert.equal(_.isObject(dat[0][0]), true);
                        assert.equal(dat[0][0].TaskName,"Common-wait");
                        done();
                      });
                    });
                  });
                });
    });

    it('should set recipe', function(done){
      mem.set(["test", 0, "definition"]
             ,[
               [
                 {TaskName:"Common-wait",
                  ExpandSeq:{"@waittime":[1000, 2000, 3000]}}
               ]
             ]
             , function(err){
                 mem.set(["test", "meta"], {standard:"", name:""} , function(err){
                   load.load(["test", 0], function(err, path){
                     mem.get(["test", 0, "recipe"] , function(err, dat){
                       assert.equal(_.isObject(dat['0']['0']), true);
                       assert.equal(_.isObject(dat['1']['0']), true);
                       assert.equal(_.isObject(dat['2']['0']), true);
                       done();
                     });
                   });
                 });
               });
    });

    it('should set recipe', function(done){
      mem.set(["test", 0, "definition"]
             ,[
               [
                 {TaskName:"Common-wait",
                  ExpandPar:{"@waittime":[4000, 5000, 6000]}}
               ]
             ], function(err){
        mem.set(["test", "meta"], {standard:"", name:""} , function(err){
          load.load(["test", 0], function(err, path){
            mem.get(["test", 0, "recipe"] , function(err, dat){
              assert.equal(_.isObject(dat['0']['0']), true);
              assert.equal(_.isObject(dat['0']['1']), true);
              assert.equal(_.isObject(dat['0']['2']), true);
              done();
            });
          });
        });
      });
    });

    it('should set recipe', function(done){
      mem.set(["test", 0, "definition"]
             ,[
               [
                 {TaskName:["Common-wait","Common-wait","Common-wait"],
                  ExpandPar:{"@waittime":[7000, 8000, 9000]}}
               ]
             ], function(err){
                 mem.set(["test", "meta"], {standard:"", name:""} , function(err){
                   load.load(["test", 0], function(err, path){
                     mem.get(["test", 0, "recipe"] , function(err, dat){
                       assert.equal(_.isObject(dat['0']['0']), true);
                       assert.equal(_.isObject(dat['0']['1']), true);
                       assert.equal(_.isObject(dat['0']['2']), true);
                       done();
                     });
                   });
                 });
               });
    });

  });
});