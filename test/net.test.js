var assert = require("assert"),
    _      = require("underscore"),
    net    = require("../lib/net"),
    gen    = require("../lib/generic"),
    deflt  = require("../lib/default"),
    mp     = {};

mp.param = gen.mod(deflt);

describe('net', function(){
  describe('#dbcon(mp)', function(){
    it('should return the nano object for db connection', function(){
      var cn = net.dbcon(mp);
      assert(true, _.isFunction(cn.relax));
    })
  })
  describe('#doc(mp)', function(){
    it('should return the db connection', function(){
      var cn = net.doc(mp);
      assert(true, _.isFunction(cn.get));
    })
  })
})