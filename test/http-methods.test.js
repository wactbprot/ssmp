var assert = require("assert")
  , _      = require("underscore")
  , meth   = require("../http-api/http-methods")

describe('http-methods', function(){
  describe('#get_path(req)', function(){

    it('should return error object on missing params', function(done){
      meth.get_path({}, function(err, res){
        assert.equal(err,"unvalid request object");
        done();
      });
    })

    it('should return error object on empty params', function(done){
      meth.get_path({params:""}, function(err, res){
        assert.equal(err,"unvalid request object");
        done();
      });
    });

    it('should return error object on missing or empty id', function(done){
      meth.get_path({params:{id:""}}, function(err, res){
        assert.equal(err,"missing id");
        done();
      });
    });

    it('should return path (id)', function(done){
      meth.get_path({params:{id:"test"}}, function(err, res){
        assert.equal(res[0], "test");
        assert.equal(err, false);
        assert.equal(res.length, 1);
        done();
      });
    });

    it('should return path (id, no)', function(done){
      meth.get_path({params:{id:"test"
                            , no:"0"}}, function(err, res){
                                          assert.equal(res[0], "test");
                                          assert.equal(res[1], "0");
                                          assert.equal(err, false);
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
                                                 assert.equal(err, false);
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
                                          assert.equal(err, false);
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
                                           assert.equal(err, false);
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
                                          assert.equal(err, false);
                                          assert.equal(res.length, 6);
                                          done();
      });
    });
  });
});