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
  describe('#task(mp)', function(){
    it('should return the task path', function(){
      var o = net.task(mp);
      assert("mp_db/_design/dbmp/_list/get/tasks",o.path);
    })
  })
 describe('#list(mp, task)', function(){
    it('should return a list path', function(){
      var o = net.list(mp, {ListName:"l", ViewName:"v"});
      assert("mp_db/_design/dbmp/_list/l/v",o.path);
    })
  })
 describe('#docinfo(mp, docid)', function(){
    it('should return the docinfo path', function(){
      var o = net.docinfo(mp, "test");
      assert("mp_db/_design/dbmp/_show/test",o.path);
    })
  })
 describe('#relay(mp)', function(){
    it('should return a relay con-object', function(){
      var o = net.relay(mp);
      assert(true,_.isObject(o));
      assert(true,_.isObject(o.headers));
      assert(true,_.isString(o.hostname));
      assert(true,_.isNumber(o.port));
      assert("POST",o.method);
    })
  })

})