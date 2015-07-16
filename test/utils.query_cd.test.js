var assert = require("assert")
  , _      = require("underscore")
  , utils  = require("../lib/utils")

describe('utils.query_cd', function(){

  describe('#query_cd()', function(){
    var now  = new Date().getTime();
    it('should give error message', function(done){
      utils.query_cd(false, false, function(err, res){
        assert.equal(err.message, "no task");
        done();
                     });
    });

    it('should give error message', function(done){
      var task = {Id:[],
                  DocPath:"Date.Now"};
      utils.query_cd(task, false, function(err, res){
        assert.equal(_.isString(res.warn), true);
        done();
      });
    });

    it('should give error message', function(done){
      var task = {Id:["ca-test_doc_1"]};
      var data = {Result:[{Date:now}]};

      utils.query_cd(task, data, function(err, res){
        assert.equal(err.message, "with given data");
        done();
      });
    });

    it('should write give', function(done){
      var task = {Id:["unknown"],
                  DocPath:"a.b.c"};
      var data = {Result:[{Date:now}]};

      utils.query_cd(task, data, function(err, res){

        assert.equal(err.message, "not_found");
        done();
      });
    });

  });
});
