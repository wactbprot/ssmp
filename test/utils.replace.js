var assert = require("assert"),
    _      = require("underscore"),
    utils  = require("../lib/utils"),
    net    = require("../lib/net"),
    deflt  = require("../lib/default"),
    ctrlstr  = deflt.ctrlStr;

describe('utils', function(){
  describe('#replace_all(inObj, replObj, cb)', function(){
    it('should replace string', function(){

      utils.replace_all({a:"@c"}, {"@c":"d"}, function(o){
        assert.equal(o.a, "d");
      });
    });

    it('should replace numbers', function(){

      utils.replace_all({a:"@c"}, {"@c":24356376}, function(o){
        assert.equal(o.a, 24356376);
      });
    });

    it('should replace array', function(){
      utils.replace_all({a:"@c"}, {"@c":["d","e"]}, function(o){
        assert.equal(o.a[0], "d");
        assert.equal(o.a[1], "e");
      });
    });

    it('should replace objects', function(){
      utils.replace_all({a:"@c"}, {"@c":{"d":"e"}}, function(o){
        assert.equal(o.a.d, "e");

      });
    });

    it('should replace objects in arrays', function(){
      utils.replace_all({a:"@c"}, {"@c":[{"d":"e"}, {"d":"f"}]}, function(o){
        assert.equal(o.a[0].d, "e");
        assert.equal(o.a[1].d, "f");
      });
    });

    it('should replace  arrays in objects', function(){
      utils.replace_all({a:"@c"}, {"@c":{"d":["e","f"]}}, function(o){
        assert.equal(o.a.d[0], "e");
        assert.equal(o.a.d[1], "f");
      });
    });

    it('should work on empty replace objects', function(){
      utils.replace_all({a:"@c"}, {}, function(o){
        assert.equal(o.a, "@c");
      });
    });

    it('should work on empty in objects', function(){
      utils.replace_all({}, {"@c":1}, function(o){
        assert.equal(_.isObject(o), true);
        assert.equal(_.isEmpty(o), true);
      });
    });


  });


  describe('#replace_in_with(task, token, value)', function(){
    it('should conserve <cr>', function(){

      assert.equal(utils.replace_in_with({a:"@a"}, "@a", "\r").a,"\r" )
    })

    it('should conserve <nl>', function(){

      assert.equal(utils.replace_in_with({a:"@a"}, "@a", "\n").a,"\n" )
    })
  })

});