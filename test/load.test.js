var assert = require("assert")
  , _      = require("underscore")
  , gen    = require("../lib/generic")
  , load   = require("../lib/load")
  , deflt  = require("../lib/default")
  , mp     = {};

mp.param = gen.mod(deflt);

describe('load', function(){

  describe('#expand_task(def, cal)', function(){
    it('should expand definition in parallel', function(){
      var definition_1 = {"TaskName":["A","B"],
                          "Replace":{
                            "@a":1
                          },
                          "ExpandPar":{
                            "@b":[1,2]
                          }
                         }
      , a = load.expand_task(definition_1, {});

      assert(1,a.length);
    })
  })
})