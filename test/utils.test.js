var assert = require("assert"),
    utils  = require("../lib/utils");

describe('utils', function(){
  describe('#cmd_to_array(cmdstr)', function(){
    it('should return an array with the given string', function(){
      var l   = "load",
          r   = "run";
      assert.equal(l, utils.cmd_to_array(l)[0]);
      assert.equal(r, utils.cmd_to_array(r)[0]);
      assert.equal(1, utils.cmd_to_array(r).length);
    })
    it('should return an array of length 2', function(){
      var l   = "load",
          r   = "run",
          lr  = "load;run";
      assert.equal(l, utils.cmd_to_array(lr)[0]);
      assert.equal(r, utils.cmd_to_array(lr)[1]);
      assert.equal(2, utils.cmd_to_array(lr).length);
    })
    it('should return an array of length 3', function(){
      var l   = "load",
          r   = "run",
          lrr  = "load;2:run";
      assert.equal(l, utils.cmd_to_array(lrr)[0]);
      assert.equal(r, utils.cmd_to_array(lrr)[1]);
      assert.equal(r, utils.cmd_to_array(lrr)[2]);
      assert.equal(3, utils.cmd_to_array(lrr).length);
    })
  })

  describe('#replace_in_with(task, token, value)', function(){
    it('should return replaced task (can be any object', function(){
      var task   = {a:"_gg",
                    b:"ff",
                    c:[1,2,3]},
          token= "_gg",
          val_1 = "replaced",
          val_2 = ["a", "b"];
      assert.equal(val_1, utils.replace_in_with(task, token, val_1).a);
      assert.equal("b", utils.replace_in_with(task, token, val_2).a[1]);

    })
  })
})