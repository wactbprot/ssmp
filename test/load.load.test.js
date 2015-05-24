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
           done();
         });
  });

  after(function(done){
      ds.destroy();
      done();
  });


  describe('#load(path)', function(){
    it('should give error on wrong path', function(done){
      load.load(["test"], function(err, path){
        assert.equal(err, "wrong path");
        done();
      });
    });

    it('should give error on wrong path', function(done){
      mem.set(["test", 0, "definition"],[[{TaskName:"Common-wait"}]] , function(err){
        load.load(["test", 0], function(err, path){
          assert.equal(err, "wrong path or meta object");
          done();
        });
      });
    });

    it('should run with minimal setup', function(done){
      mem.set(["test", 0, "definition"],[[{TaskName:"Common-wait"}]] , function(err){
        mem.set(["test", "meta"], {standard:"", name:""} , function(err){
          load.load(["test", 0], function(err, path){
            assert.equal(err, false);
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