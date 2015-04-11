var assert = require("assert"),
    _      = require("underscore"),
    utils  = require("../lib/utils"),
    net    = require("../lib/net"),
    deflt  = require("../lib/default"),
    ctrlstr  = deflt.ctrlStr;

var req    = {}
  , id     = "mp-waittest";

req.params    = {};
req.params.id = id;
req.body      = "load";

describe('utils', function(){

  describe('#vl_date()', function(){
    it('should return the wellknown date format', function(){
      var d = utils.vl_date();
      assert.equal(true, _.isString(d));
      assert.equal( "2014-07-25 21:25", utils.vl_date("Fri Jul 25 2014 21:25:06 GMT+0200 (CEST)") );

    });
  });

  describe('#vl_time()', function(){
    it('should return a string', function(){
      var t = utils.vl_time();
      assert.equal( true, _.isString(t));
      assert.equal( "1406316306000", utils.vl_time("Fri Jul 25 2014 21:25:06 GMT+0200 (CEST)"));
    });
  });

  describe('#as_arr(state)', function(){
    it('should generate false on wrong input', function(){
      assert.equal(utils.as_arr([]), false);
      assert.equal(utils.as_arr("ll"), false);
    });

    it('should a flat array', function(){
      assert.equal(utils.as_arr({ '0': { '0': 'ready'}})[0], "ready");
    });
  });

  describe('#all_same(arr, val)', function(){
    it('should return false on wrong values', function(){
      assert.equal(utils.all_same ({}, "tst"), false);
      assert.equal(utils.all_same ([], true), false);
    });

    it('should return true on all same', function(){
      assert.equal(utils.all_same ([["tst"]], "tst"), true);
      assert.equal(utils.all_same (["tst"], "tst"), true);
    });
  });


  describe('#cp(template, inival, cb)', function(){

    it('should return error on wrong template level 0', function(){
      utils.cp("wrong", 2, function(err, res){
        assert.equal(err, "wrong template");
      });
    });

    it('should return error on wrong template level 1', function(){
      utils.cp({"0":"k"}, 2, function(err, res){
        assert.equal(err, "wrong template");
      });
    });

    it('should do his work', function(){
      utils.cp({"0":{"0":1}}, 2, function(err, res){
        assert.equal(res["0"]["0"], 2);
      });
    });
  });
})
