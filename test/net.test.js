var assert = require("assert")
  , _      = require("underscore")
  , net    = require("../lib/net")
  , deflt  = require("../lib/default")


describe('net', function(){
  describe('#task(mp)', function(){
    it('should return the task path', function(){
      var o = net.task();
      assert.equal( o.path, "/"+deflt.database.name + "/_design/dbmp/_list/gettask/tasks");
    });
  });
  describe('#task()', function(){
    it('should return the task path \wo mp', function(){
      var o = net.task();
      assert.equal(o.path, "/"+deflt.database.name + "/_design/dbmp/_list/gettask/tasks");
    });
  });

  describe('#list(mp, task)', function(){
    it('should return a list path', function(){
      var o = net.list({ListName:"l", ViewName:"v"});
      assert.equal(o.path,  "/"+deflt.database.name + "/_design/dbmp/_list/l/v");
    });

    it('should return a list path \wo mp', function(){
      var o = net.list({ListName:"l", ViewName:"v"});
      assert.equal(o.path, "/"+deflt.database.name + "/_design/dbmp/_list/l/v");
    });

    it('should work with params keys', function(){
      var o = net.list({ListName:"l", ViewName:"v", Param:{keys:"aa"}});
      assert.equal(o.path, "/"+deflt.database.name + "/_design/dbmp/_list/l/v?keys=\"aa\"");
    });

    it('should work with params user', function(){
      var o = net.list({ListName:"l", ViewName:"v", Param:{"bb":"aa"}});
      assert.equal(o.path, "/"+deflt.database.name + "/_design/dbmp/_list/l/v?bb=aa");
    });

  });

  describe('#docinfo(mp, docid)', function(){
    it('should return the docinfo path', function(){
      var o = net.docinfo("test");
      assert(o.path, "/"+deflt.database.name + "/_design/dbmp/_show/test");
    });

    it('should return the docinfo path \wo mp', function(){
      var o = net.docinfo("test");
      assert(o.path, "/"+deflt.database.name + "/_design/dbmp/_show/test");
    });
  });

  describe('#relay(mp)', function(){
    it('should return a relay con-object', function(){
      var o = net.relay();
      assert(true, _.isObject(o));
      assert(true, _.isObject(o.headers));
      assert(true, _.isString(o.hostname));
      assert(true, _.isNumber(o.port));
      assert("POST", o.method);
    });

    it('should return a relay con-object  \wo mp', function(){
      var o = net.relay();
      assert(true, _.isObject(o));
      assert(true, _.isObject(o.headers));
      assert(true, _.isString(o.hostname));
      assert(true, _.isNumber(o.port));
      assert("POST", o.method);
    });
  });

  describe('#wrtdoc(docid)', function(){
    it('should return the write url', function(){
      var o = net.wrtdoc("test");
      assert(o.path, "/"+deflt.database.name + "/test");
    });
  });

});