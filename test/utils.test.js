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

  describe('#replace_in_with(task, token, value)', function(){
    it('should return replaced task (can be any object', function(){
      var task    = {a:"_gg",
                     b:"ff",
                     c:[1, 2, 3]},
          token   = "_gg",
          val_1   = "replaced",
          val_2   = ["a",
                     "b"];
      assert.equal(val_1, utils.replace_in_with(task, token, val_1).a);
      assert.equal("b", utils.replace_in_with(task, token, val_2).a[1]);
      assert.equal(3, utils.replace_in_with(task, token, val_2).c[2]);
    })
  })


  describe('#vlDate()', function(){
    it('should return the wellknown date format', function(){
      assert.equal( "2014-07-25 21:25", utils.vlDate("Fri Jul 25 2014 21:25:06 GMT+0200 (CEST)"));

    })
  })
  describe('#vlTime()', function(){
    it('should return a string', function(){
      assert.equal( "1406316306000", utils.vlTime("Fri Jul 25 2014 21:25:06 GMT+0200 (CEST)"));

    })
  })
})
