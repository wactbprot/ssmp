var assert = require("assert")
  , _      = require("underscore")
  , broker = require("sc-broker")
  , conf   = require("../lib/conf")
  , meth
  , mem
  , ds

describe('http-methods', function(){
  before(function(done){
    mem  = broker.createClient({port: conf.mem.port})
    meth = require("../api/methods")
    done();
  });

  describe('#get_path(req)', function(){
    it('should return error object on missing params', function(done){
      meth.get_path({}, function(err, res){
        assert.equal(err.message,"unvalid request object");
        done();
      });
    })

    it('should return error object on empty params', function(done){
      meth.get_path({params:""}, function(err, res){
        assert.equal(err.message,"unvalid request object");
        done();
      });
    });

    it('should return error object on missing or empty id', function(done){
      meth.get_path({params:{id:""}}, function(err, res){
        assert.equal(err.message,"missing id");
        done();
      });
    });

    it('should return path (id)', function(done){
      meth.get_path({params:{id:"test"}}, function(err, res){
        assert.equal(res[0], "test");
        assert.equal(err, null);
        assert.equal(res.length, 1);
        done();
      });
    });

    it('should return path (id, no)', function(done){
      meth.get_path({params:{id:"test"
                            , no:"0"}}, function(err, res){
                                          assert.equal(res[0], "test");
                                          assert.equal(res[1], "0");
                                          assert.equal(err, null);
                                          assert.equal(res.length, 2);
                                          done();
                                        });
    });

    it('should return path (id, no, struct)', function(done){
      meth.get_path({params:{id:"test"
                            , no:"0"
                            , struct:"test"}}, function(err, res){
                                                 assert.equal(res[0], "test");
                                                 assert.equal(res[1], "0");
                                                 assert.equal(res[2], "test");
                                                 assert.equal(err, null);
                                                 assert.equal(res.length, 3);
                                                 done();
                                               });
    });

    it('should return path (id, no, struct, l1)', function(done){
      meth.get_path({params:{id:"test"
                            , no:"0"
                            , struct:"test"
                            , l1:"0"}}, function(err, res){
                                          assert.equal(res[0], "test");
                                          assert.equal(res[1], "0");
                                          assert.equal(res[2], "test");
                                          assert.equal(res[3], "0");
                                          assert.equal(err, null);
                                          assert.equal(res.length, 4);
                                          done();
                                        });
    });

    it('should return path (id, no, struct, l1, l2)', function(done){
      meth.get_path({params:{id:"test"
                            , no:"0"
                            , struct:"test"
                            , l1:"0"
                            , l2: "0"}}, function(err, res){
                                           assert.equal(res[0], "test");
                                           assert.equal(res[1], "0");
                                           assert.equal(res[2], "test");
                                           assert.equal(res[3], "0");
                                           assert.equal(res[4], "0");
                                           assert.equal(err, null);
                                           assert.equal(res.length, 5);
                                           done();
                                         });
    });

    it('should return path (id, no, struct, l1, l2, l3)', function(done){
      meth.get_path({params:{id:"test"
                            , no:"0"
                            , struct:"test"
                            , l1:"1"
                            , l2:"2"
                            , l3:"3"}}, function(err, res){
                                          assert.equal(res[0], "test");
                                          assert.equal(res[1], "0");
                                          assert.equal(res[2], "test");
                                          assert.equal(res[3], "1");
                                          assert.equal(res[4], "2");
                                          assert.equal(res[5], "3");
                                          assert.equal(err, null);
                                          assert.equal(res.length, 6);
                                          done();
                                        });
    });
  });

  describe('#get(req)', function(){

    it('should return error object on missing params', function(done){
      meth.get({}, function(err, res){
        assert.equal(err.message, "unvalid request object");
        done();
      });
    });

    it('should return error object on missing value', function(done){
      meth.get({params:{id:"foo"}}, function(err, res){
        assert.equal(err.message,"object is undefined");
        done();
      });
    });

    it('should return result: boolean value', function(done){
      mem.set(["test"], true, function(){
        meth.get({params:{id:"test"}}, function(err, res){
          assert.equal(res.result,true);
          done();
        });
      });
    });

    it('should return object', function(done){
      mem.set(["test"], {test:true}, function(){
        meth.get({params:{id:"test"}}, function(err, res){
          assert.equal(res.test,true);
          done();
        });
      });
    });

    describe('#put(req)', function(){

      it('should return error on empty request', function(done){
        meth.put({}, function(err, res){
          assert.equal(err.message, "unvalid request object");
          done();
        });
      });

      it('should return error on empty request', function(done){
        meth.put({params:{id:"test"}}, function(err, res){
          assert.equal(err.message,"unvalid request body");
          done();
        });
      });

      it('should put value', function(done){
        meth.put({params:{id:"test"}, body:{test:true}}, function(err, res){
          assert.equal(res.ok, true);
          done();
        });
      });
    });

    describe('#handle_cd(req)', function(){

      it('should return error on empty request', function(done){
        meth.handle_cd({}, function(err, res){
          assert.equal(err.message, "unvalid request object");
          done();
        });
      });

      it('should return error on empty body', function(done){
        meth.handle_cd({params:{id:"test", cdid:"test"}}, function(err, res){
          assert.equal(err.message, "unvalid request body");
          done();
        });
      });

      it('should load', function(done){
        meth.handle_cd({params:{id:"test", cdid:"test"}, body:"load"}, function(err, res){
          assert.equal(res.ok,true);
          done();
        });
      });

      it('should remove', function(done){
        meth.handle_cd({params:{id:"test", cdid:"test"}, body:"remove"}, function(err, res){
          assert.equal(res.ok,true);
          done();
        });
      });

      describe('#handle_mb(req)', function(){

        it('should return error on empty request', function(done){
          meth.handle_mp({}, function(err, res){
            assert.equal(err.message, "unvalid request object");
            done();
          });
        });

        it('should return error on empty body', function(done){
          meth.handle_mp({params:{id:"test", cdid:"test"}}, function(err, res){
            assert.equal(err.message, "unvalid request body");
            done();
          });
        });

        it('should load', function(done){
          meth.handle_mp({params:{id:"test", cdid:"test"}, body:"load"}, function(err, res){
            assert.equal(res.ok, true);
            done();
          });
        });

        it('should remove', function(done){
          meth.handle_mp({params:{id:"test", cdid:"test"}, body:"remove"}, function(err, res){
            assert.equal(res.ok, true);
            done();
          });
        });

      });
    });

  });
});