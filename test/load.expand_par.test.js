var assert = require("assert")
  , _      = require("underscore")
  , load   = require("../lib/load")
  , deflt  = require("../lib/default");

describe('load', function(){
  describe('#expand_task(def, cal)', function(){
    it('should expand definition in parallel', function(done){
      var d1 = {"TaskName":["A","B"],
                "Replace":{
                  "@a":1
                },
                "ExpandPar":{
                  "@b":[1,2]
                }
               }
        , a = load.expand_task(d1, {});

      assert.equal(1,   a.length);
      assert.equal(2,   a[0].length);
      assert.equal(undefined,   a[1]);

      assert.equal("A", a[0][0].TaskName);
      assert.equal("B", a[0][1].TaskName);

      assert.equal(1,   a[0][0].Replace["@a"]);
      assert.equal(1,   a[0][0].Replace["@b"]);

      assert.equal(1,   a[0][1].Replace["@a"]);
      assert.equal(2,   a[0][1].Replace["@b"]);
      done()

    })

    it('should also work with a string TaskName', function(done){
      var d1 = {"TaskName":"A",
                "Replace":{
                  "@a":1
                },
                "ExpandPar":{
                  "@b":[1,2]
                }
               }
        , a = load.expand_task(d1, {});

      assert.equal(1,   a.length);
      assert.equal(2,   a[0].length);
      assert.equal(undefined,   a[1]);

      assert.equal("A", a[0][0].TaskName);
      assert.equal("A", a[0][1].TaskName);

      assert.equal(1,   a[0][0].Replace["@a"]);
      assert.equal(1,   a[0][0].Replace["@b"]);

      assert.equal(1,   a[0][1].Replace["@a"]);
      assert.equal(2,   a[0][1].Replace["@b"]);


      done();
    })

  })
})

/**
 *
  * ## ExpandPar
 * ```
 * {
 *   "TaskName": [
 *     "A",
 *     "B",
 *     "C"
 *   ],
 *   "Replace": {
 *     "@a": 1
 *   },
 *   "ExpandPar": {
 *     "@b": [
 *       1,
 *       2,
 *       3
 *     ]
 *   }
 * }
 * ```
 * wird zu
 * ```
 * [
 *   [
 *     {
 *       "TaskName": "A",
 *       "Replace": {
 *         "@a": 1,
 *         "@b": 1
 *       },
 *       "Id": []
 *     },
 *     {
 *       "TaskName": "B",
 *       "Replace": {
 *         "@a": 1,
 *         "@b": 2
 *       },
 *       "Id": []
 *     },
 *     {
 *       "TaskName": "C",
 *       "Replace": {
 *         "@a": 1,
 *         "@b": 3
 *       },
 *       "Id": []
 *     }
 *   ]
 * ]
 * ```
 */
