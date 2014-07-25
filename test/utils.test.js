var assert = require("assert"),
    _      = require("underscore"),
    gen    = require("../lib/generic"),
    utils  = require("../lib/utils");

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

  describe('#get_path(req)', function(){
    it('should return a path array', function(){
      var req = {params:{}};
      req.params.struct = "test";

      assert.equal(true, _.isEmpty(utils.get_path(req)));
      req.params.l1 = "a";
      assert.equal("a", utils.get_path(req)[0]);
      req.params.l2 = "b";
      assert.equal("b", utils.get_path(req)[1]);
      req.params.l3 = "c";
      assert.equal("c", utils.get_path(req)[2]);
    })
  })
  describe('#get(mps, req)', function(){
    it('should return error messages and stuff', function(){
      var req = {params:{}},
          mps = {};

      assert.equal("mpdef not found", utils.get(mps, req).error);

      mps.id            = {};
      req.params.id     = "id";
      req.params.struct = "test";
      assert.equal("undefined structure", utils.get(mps, req).error);

      mps.id.test       = gen.mod({a:0});
      assert.equal(0, utils.get(mps, req).a);

      req.params.l1     = "test";
      mps.id.test       = gen.mod();
      assert.equal("object is undefined", utils.get(mps, req).error);

      mps.id.test       = gen.mod({test:true});
      assert.equal(true, utils.get(mps, req).result);

      mps.id.test       = gen.mod({test:{a:0}});
      assert.equal(0, utils.get(mps, req).a);

      mps.id.test       = gen.mod({test:[0,1]});
      assert.equal(0, utils.get(mps, req)[0]);
    })
  })

  describe('#put(mps, req, cb)', function(){
    it('should return error messages and stuff', function(){

      var mps           = {};
      mps.id            = {};
      mps.id.test       = gen.mod();

      var req           = {params:{}};
      req.params.id     = "id";

      utils.put(mps, req, function(ret){
        assert.equal("object not valid", ret.error)
      })

      req.body          =  {a:"_gg",
                            b:"ff",
                            c:[1,2,3]},

      utils.put(mps, req, function(ret){
        assert.equal("not a valid structure", ret.error)
      })

      req.params.struct = "test",

      utils.put(mps, req, function(ret){
        assert.equal("empty path", ret.error)
      })

      req.params.l1     = "a";
      utils.put(mps, req, function(ret){
        assert.equal(true, ret.ok)
      })
    })
  })

  describe('#del(mps, req, cb)', function(){
    it('should return error messages and stuff', function(){

      var mps           = {};
      mps.id            = {};
      mps.id.test       = gen.mod({a:0});

      var req = {params:{}};
      req.params.id     = "id";


      utils.del(mps, req, function(ret){
        assert.equal("not a valid structure", ret.error)
      })

      req.params.struct = "test",

      utils.del(mps, req, function(ret){
        assert.equal("empty path", ret.error)
      })

      req.params.l1     = "a";
      utils.del(mps, req, function(ret){
        assert.equal(true, ret.ok)
      })
    })
  })

})
