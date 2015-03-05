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
  describe('#cmd_to_array(cmdstr)', function(){
    it('should return an array containing the given string', function(){
      var  r   = "run";
      assert.equal(true, _.isArray(utils.cmd_to_array(r)));
      assert.equal(r, utils.cmd_to_array(r)[0]);
      assert.equal(1, utils.cmd_to_array(r).length);
    })
    it('should return an array containing the given string', function(){
      var  r   = "mon";
      assert.equal(true, _.isArray(utils.cmd_to_array(r)));
      assert.equal(r, utils.cmd_to_array(r)[0]);
      assert.equal(1, utils.cmd_to_array(r).length);
    })
    it('should return an array of length 2', function(){
      var l   = "load",
          r   = "run",
          lr  = "load;run";
      assert.equal(true, _.isArray(utils.cmd_to_array(lr)));
      assert.equal(l, utils.cmd_to_array(lr)[0]);
      assert.equal(r, utils.cmd_to_array(lr)[1]);
      assert.equal(2, utils.cmd_to_array(lr).length);
    })
    it('should return an array of length 3', function(){
      var l   = "load",
          r   = "run",
          lrr  = "load;2:run";
      assert.equal(true, _.isArray(utils.cmd_to_array(lrr)));
      assert.equal(l, utils.cmd_to_array(lrr)[0]);
      assert.equal(r, utils.cmd_to_array(lrr)[1]);
      assert.equal(r, utils.cmd_to_array(lrr)[2]);
      assert.equal(3, utils.cmd_to_array(lrr).length);
    })
    it('should return an empty string at position 0', function(){
      assert.equal(true, _.isArray(utils.cmd_to_array("")));
      assert.equal("", utils.cmd_to_array("")[0]);
    })
  })

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
  });

  describe('#as_array(state)', function(){
    it('should a flat array', function(){
      assert.equal(utils.as_arr({ '0': { '0': 'ready'}})[0], "ready");
    });
  });

  describe('#all_same(arr, val)', function(){
    it('should return false on wrong values', function(){
      assert.equal(utils.all_same ({}, "tst"), false);
      assert.equal(utils.all_same ([], true), false);
    });
  });

  describe('#all_same(arr, val)', function(){
    it('should return true on all same', function(){
      assert.equal(utils.all_same ([["tst"]], "tst"), true);
      assert.equal(utils.all_same (["tst"], "tst"), true);
    });
  });

})
