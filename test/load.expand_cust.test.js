var assert = require("assert")
  , _      = require("underscore")
  , load   = require("../lib/load")
  , conf  = require("../lib/conf")

describe('load', function(){

  describe('#expand_cust(def, calobs)', function(){

    var ret =  load.expand_cust({},{});
    it('should have Id with empty objects', function(){
      assert.equal(_.isArray(ret[0][0].Id), true);
    });

    it('should have DeviceName with empty objects', function(){
      assert.equal(ret[0][0].DeviceName, "CustomerDevice");
    });

    it('should have TaskName with empty objects', function(){
      assert.equal(ret[0][0].TaskName, "CustomerDevice-MissingTaskName");
    });
  });

  describe('#expand_cust(def, calobs)', function(){

    var ret =  load.expand_cust({TaskName:"A"},{a:{Device:"M"},b:{Device:"N"}});

    it('should deliver tasks with one Id', function(){
      assert.equal(ret[0][0].Id.length , 1)
      assert.equal(ret[0][0].Id[0] , "a")
      assert.equal(ret[0][0].TaskName , "M-A")
    });

    it('should deliver tasks with one Id', function(){
      assert.equal(ret[0][1].Id.length , 1)
      assert.equal(ret[0][1].Id[0] , "b")
      assert.equal(ret[0][1].TaskName , "N-A")
    });

  });

});