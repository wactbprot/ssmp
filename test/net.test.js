var assert   = require("assert")
  , broker   = require("sc-broker")
  , _        = require("underscore")
  , net      = require("../lib/net")
  , conf     = require("../lib/conf")
  , mem      = broker.createClient({port: conf.mem.port});

describe('net', function(){
  mem.get(["defaults"], function(err, defaults){

    describe('#task(mp)', function(){
      it('should return the task path', function(done){
        net.task(null, function(err, o){
          assert.equal( o.path
                      , "/"+ defaults.database.name
                      + "/_design/dbmp/_list/gettask/tasks");
          done();
        });
      });
    });
    describe('#task()', function(){
      it('should return the task path \wo mp', function(done){
        net.task(null, function(err, o){
          assert.equal(o.path
                      , "/"+defaults.database.name
                      + "/_design/dbmp/_list/gettask/tasks");
          done();
        });
      });
    });

    describe('#list(mp, task)', function(){
      it('should return a list path', function(done){
        net.list({ListName:"l", ViewName:"v"}, function(err, o){
          assert.equal(o.path
                      , "/"+defaults.database.name
                      + "/_design/dbmp/_list/l/v");
          done();
        });
      });

      it('should return a list path \wo mp', function(done){
        var o = net.list({ListName:"l", ViewName:"v"}, function(err, o){
                  assert.equal(o.path
                              , "/"+defaults.database.name
                              + "/_design/dbmp/_list/l/v");
                  done();
                });
      });

      it('should work with params keys', function(done){
        net.list({ListName:"l", ViewName:"v", Param:{keys:"aa"}}, function(err, o){
          assert.equal(o.path
                      , "/"+defaults.database.name
                      + "/_design/dbmp/_list/l/v?keys=\"aa\"");
          done();
        });
      });

      it('should work with params user', function(done){
        net.list({ListName:"l", ViewName:"v", Param:{"bb":"aa"}}, function(err, o){
          assert.equal(o.path
                      , "/"+defaults.database.name
                      + "/_design/dbmp/_list/l/v?bb=aa");
          done();
        });
      });
    });

    describe('#docinfo(mp, docid)', function(){
      it('should return the docinfo path', function(done){
        net.docinfo("test", function(err, o){
          assert(o.path
                , "/"+defaults.database.name
                + "/_design/dbmp/_show/test");
          done();
        });
      });

      it('should return the docinfo path \wo mp', function(done){
        net.docinfo("test", function(err, o){
          assert(o.path
                , "/"+defaults.database.name
                + "/_design/dbmp/_show/test");
          done();
        });
      });
    });

    describe('#relay(mp)', function(){
      it('should return a relay con-object', function(done){
        net.relay(function(err, o){
          assert(true, _.isObject(o));
          assert(true, _.isObject(o.headers));
          assert(true, _.isString(o.hostname));
          assert(true, _.isNumber(o.port));
          assert("POST", o.method);
          done();
        });
      });

      it('should return a relay con-object  \wo mp', function(done){
        net.relay(function(err, o){
          assert(true, _.isObject(o));
          assert(true, _.isObject(o.headers));
          assert(true, _.isString(o.hostname));
          assert(true, _.isNumber(o.port));
          assert("POST", o.method);
          done();
        });
      });
    });

    describe('#wrtdoc(docid)', function(){
      it('should return the write url', function(done){
        net.wrtdoc("test", function(err, o){
          assert(o.path, "/"+defaults.database.name + "/test");
          done();
        });
      });
    });
  }); // defaults
});
