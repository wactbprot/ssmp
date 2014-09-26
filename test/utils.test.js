var assert = require("assert"),
    _      = require("underscore"),
    gen    = require("../lib/generic"),
    utils  = require("../lib/utils"),
    net    = require("../lib/net"),
    deflt  = require("../lib/default"),
    inimp  = require("../lib/ini_mp"),
    ctrlstr  = deflt.ctrlStr;

var mps    = {},
    req    = {},
    id     = "simdef";

req.params    = {};
req.params.id = id;
req.body      = "load";


inimp(mps, req, function(ret){

  var mp = mps[id];

  describe('utils', function(){
    describe('#cmd_to_array(cmdstr)', function(){
      it('should return an array containing the given string', function(){
        var  r   = "run";
        assert.equal(true, _.isArray(utils.cmd_to_array(r)));
        assert.equal(r, utils.cmd_to_array(r)[0]);
        assert.equal(1, utils.cmd_to_array(r).length);
      })
      it('should return an array of length 2', function(){
        var l   = "load",
            r   = "run",
            lr  = "load;run";
        assert.equal(true, _.isArray(utils.cmd_to_array(lr)));
        assert.equal(l, utils.cmd_to_array(lr)[0]);
        assert.equal(r, utils.cmd_to_array(lr)[1]);
        assert.equal(2, utils.cmd_to_array(lr).length);
      })
      it('should return an array of length 3', function(){
        var l   = "load",
            r   = "run",
            lrr  = "load;2:run";
        assert.equal(true, _.isArray(utils.cmd_to_array(lrr)));
        assert.equal(l, utils.cmd_to_array(lrr)[0]);
        assert.equal(r, utils.cmd_to_array(lrr)[1]);
        assert.equal(r, utils.cmd_to_array(lrr)[2]);
        assert.equal(3, utils.cmd_to_array(lrr).length);
      })
      it('should return an empty string at position 0', function(){
        assert.equal(true, _.isArray(utils.cmd_to_array("")));
        assert.equal("", utils.cmd_to_array("")[0]);
      })
    })

    describe('#replace_in_with(task, token, value)', function(){
      it('should return replaced task (can be any object', function(){
        var task    = {a:"_gg",
                       b:"ff",
                       c:[1, 2, 3]},
            token   = "_gg",
            val_1   = "replaced",
            val_2   = ["a",
                       "b"];
        assert.equal(val_1, utils.replace_in_with(task, token, val_1).a);
        assert.equal("b", utils.replace_in_with(task, token, val_2).a[1]);
        assert.equal(3, utils.replace_in_with(task, token, val_2).c[2]);
      })
    })

    describe('#get_path(req)', function(){
      it('should return a path array', function(){
        var req = {params:{}};
        req.params.struct = "test";

        assert.equal(true, _.isEmpty(utils.get_path(req)));
        req.params.l1 = "a";
        assert.equal("a", utils.get_path(req)[0]);
        req.params.l2 = "b";
        assert.equal("b", utils.get_path(req)[1]);
        req.params.l3 = "c";
        assert.equal("c", utils.get_path(req)[2]);
      })
    })

    describe('#get(mps, req)', function(){
      it('should return error messages and stuff', function(){

        req.params = {};

        assert.equal("mpdef not found", utils.get(mps, req).error);

        mps.id            = {};
        req.params.id     = "id";
        req.params.struct = "test";
        assert.equal("undefined structure", utils.get(mps, req).error);

        mps.id.test       = gen.mod({a:0});
        assert.equal(0, utils.get(mps, req).a);

        req.params.l1     = "test";
        mps.id.test       = gen.mod();
        assert.equal("object is undefined", utils.get(mps, req).error);

        mps.id.test       = gen.mod({test:true});
        assert.equal(true, utils.get(mps, req).result);

        mps.id.test       = gen.mod({test:{a:0}});
        assert.equal(0, utils.get(mps, req).a);

        mps.id.test       = gen.mod({test:[0,1]});
        assert.equal(0, utils.get(mps, req)[0]);
      })
    })

    describe('#put(mps, req, cb)', function(){
      it('should return error messages and stuff', function(){

        mps.id            = {};
        mps.id.test       = gen.mod();
        req.params.id     = "id";

        delete req.body;

        utils.put(mps, req, function(ret){
          assert.equal("object not valid", ret.error)
        })

        req.body          =  {a:"_gg",
                              b:"ff",
                              c:[1,2,3]};

        delete req.params.struct

        utils.put(mps, req, function(ret){
          assert.equal("not a valid structure", ret.error)
        })

        req.params.struct = "test",
        delete req.params.l1;

        utils.put(mps, req, function(ret){
          assert.equal("empty path", ret.error)
        })

        req.params.l1     = "a";
        utils.put(mps, req, function(ret){
          assert.equal(true, ret.ok)
        })

      })
    })

    describe('#del(mps, req, cb)', function(){
      it('should return error messages and stuff', function(){

        delete req.params.struct

        utils.del(mps, req, function(ret){
          assert.equal("not a valid structure", ret.error)
        })

        req.params.struct = "test",
        delete req.params.l1;

        utils.del(mps, req, function(ret){
          assert.equal("empty path", ret.error)
        })

        req.params.l1     = "a";

        utils.del(mps, req, function(ret){
          assert.equal(true, ret.ok)
        })

      })
    })

    describe('#vlDate()', function(){
      it('should return the wellknown date format', function(){
        assert.equal( "2014-07-25 21:25", utils.vlDate("Fri Jul 25 2014 21:25:06 GMT+0200 (CEST)"));

      })
    })
    describe('#vlTime()', function(){
      it('should return a string', function(){
        assert.equal( "1406316306000", utils.vlTime("Fri Jul 25 2014 21:25:06 GMT+0200 (CEST)"));

      })
    })

    describe('#data_to_doc()', function(){
      it('should set the type, unit, value and comment structures given', function(){
        var doc     = {dest:{}},
            path    = "dest.aim",
            dataset = [{Type:"test1",
                        Unit:"tu",
                        Value:123,
                        Comment:"comment1"}];

        utils.data_to_doc(doc, path, dataset,function(d){
          assert.equal(d.dest.aim[0].Value.length, 1);
          assert.equal(d.dest.aim[0].Value[0], 123);
          assert.equal(d.dest.aim[0].Comment[0],"comment1" );
        } )

        dataset[0].Value = 234;

        utils.data_to_doc(doc, path, dataset,function(d){
          assert.equal(d.dest.aim[0].Value.length, 2);
          assert.equal(d.dest.aim[0].Value[1], 234);
        } )

        dataset[0].Type = "test2";
        dataset[0].Comment = "comment2";

        utils.data_to_doc(doc, path, dataset,function(d){
          assert.equal(d.dest.aim[1].Value.length, 1);
          assert.equal(d.dest.aim[1].Value[0], 234);
          assert.equal(d.dest.aim[1].Comment[0],"comment2" );
        } )

        dataset[0].Value = 567;

        utils.data_to_doc(doc, path, dataset,function(d){
          assert.equal(d.dest.aim[1].Value.length, 2);
          assert.equal(d.dest.aim[1].Value[1], 567);
        } )
      })
    })

    describe('#data_to_doc()', function(){
      it('should set the kv structures given', function(){

        var doc     = {dest:{}},
            dataset = [{operationKind:"opk1"}],
            path    = "dest.SequenceControl";

        utils.data_to_doc(doc, path, dataset,function(d){
          assert.equal(d.dest.SequenceControl.operationKind,"opk1");
        } )

        dataset = [{Gas:"N2"}];
        path    = "dest.SequenceControl";

        utils.data_to_doc(doc, path, dataset,function(d){
          assert.equal(d.dest.SequenceControl.Gas,"N2");
        } )

        dataset = [{A:"B"}, {C:"D"}];
        path    = "dest.SequenceControl";

        utils.data_to_doc(doc, path, dataset,function(d){
          assert.equal(d.dest.SequenceControl.A,"B");
          assert.equal(d.dest.SequenceControl.C,"D");
        } )

      })
    })
  })
})
