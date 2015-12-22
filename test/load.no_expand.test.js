var assert = require("assert")
  , _      = require("underscore")
  , load   = require("../lib/load")
  , conf   = require("../lib/conf");

describe('load', function(){
  describe('#expand_task(def, cal)', function(){
    it('should not expand definition ', function(done){
      var d1 = {"TaskName":"A",
                "Replace":{
                  "@a":1
                },
                "Use":{
                  "@b":"c"
                }
               }
        , a = load.expand_task(d1, {});

      assert.equal(1,   a.length);

      assert.equal(1,   a[0].length);
      assert.equal(undefined,  a[1]);

      assert.equal("A", a[0][0].TaskName);
      assert.equal(1,   a[0][0].Replace["@a"]);
      assert.equal("c", a[0][0].Use["@b"]);

      done()
    })
  })
})

/**
 * ## Keine Vervielfältigung
 * ```
 * {
 *   "TaskName": "A"
 *   "Replace": {
 *     "@a": 1
 *   },
 *   "Use": {
 *     "@b": "c"
 *   }
 * }
 * ```
 * wird zu
 * ```
 * [
 *   [
 *    {
 *      "TaskName": "A"
 *      "Replace": {
 *        "@a": 1
 *      },
 *      "Use": {
 *        "@b": "c"
 *      }
 *    }
 *   ]
 * ]
 * ```
 */
