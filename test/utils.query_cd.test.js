var assert = require("assert")
  , _      = require("underscore")
  , utils  = require("../lib/utils")

describe('utils.query_cd', function(){

  describe('#query_cd()', function(){
    var now  = new Date().getTime();
    it('should give error message', function(done){
      utils.query_cd(false, false,
                     function(res){
                       assert.equal(_.isString(res.error), true);
                       done();
                     });
    });

    it('should give error message', function(done){

      var task = {Id:[],
                  DocPath:"Date.Now"};

      utils.query_cd(task, false,
                     function(res){
                       assert.equal(_.isString(res.warn), true);
                       done();
                     });
    });

    it('should give error message', function(done){

      var task = {Id:["ca-test_doc_1"]};
      var data = {Result:[{Date:now}]};

      utils.query_cd(task, data,
                     function(res){
                       assert.equal(_.isString(res.error), true);
                       done();
                     });
    });
  });
});
