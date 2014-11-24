var assert = require("assert"),
    _      = require("underscore"),
    meth   = require("../lib/methods"),
    net    = require("../lib/net"),
    deflt  = require("../lib/default"),
    ctrlstr  = deflt.ctrlStr;

  describe('#get_path(req)', function(){
    it('should return a path array', function(){

      var req = {params:{id : "a"
                        , no : "b"
                        , struct: "s"
                        , l1 : "c"
                        , l2 : "d"
                        , l3 : "e"}};

      assert.equal(true, _.isEmpty(meth.get_path({})));
      assert.equal("a", meth.get_path(req)[0]);
      assert.equal("b", meth.get_path(req)[1]);
      assert.equal("s", meth.get_path(req)[2]);
      assert.equal("c", meth.get_path(req)[3]);
      assert.equal("d", meth.get_path(req)[4]);
      assert.equal("e", meth.get_path(req)[5]);
    })
  })
