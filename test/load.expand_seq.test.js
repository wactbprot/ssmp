var assert = require("assert")
  , _      = require("underscore")
  , load   = require("../lib/load")
  , deflt  = require("../lib/default")

describe('load', function(){
  describe('#expand_task(def, cal)', function(){

    it('should expand definition in series', function(done){
      var d1 = {"TaskName":["A","B"],
                "Replace":{
                  "@a":1
                },
                "ExpandSeq":{
                  "@b":[1,2]
                }
               }
        , a = load.expand_task(d1, {});

      assert.equal(2,   a.length);
      assert.equal(1,   a[0].length);
      assert.equal(1,   a[1].length);

      assert.equal(undefined,   a[2]);

      assert.equal("A", a[0][0].TaskName);
      assert.equal("B", a[1][0].TaskName);

      assert.equal(1,   a[0][0].Replace["@a"]);
      assert.equal(1,   a[0][0].Replace["@b"]);

      assert.equal(1,   a[1][0].Replace["@a"]);
      assert.equal(2,   a[1][0].Replace["@b"]);
      done()
    })

    it('should work with a String as Taskname', function(done){
      var d1 = {"TaskName":"A",
                "Replace":{
                  "@a":1
                },
                "ExpandSeq":{
                  "@b":[1,2]
                }
               }
        , a = load.expand_task(d1, {});

      assert.equal(2,   a.length);
      assert.equal(1,   a[0].length);
      assert.equal(1,   a[1].length);

      assert.equal(undefined,   a[2]);

      assert.equal("A", a[0][0].TaskName);
      assert.equal("A", a[1][0].TaskName);

      assert.equal(1,   a[0][0].Replace["@a"]);
      assert.equal(1,   a[0][0].Replace["@b"]);

      assert.equal(1,   a[1][0].Replace["@a"]);
      assert.equal(2,   a[1][0].Replace["@b"]);
      done()
    })
  });
});
