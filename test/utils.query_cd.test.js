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

  describe('utils.query_cd', function(){

    describe('#query_cd()', function(){
      var now  = new Date().getTime();
      it('should give error message', function(done){
        utils.query_cd(mp, false, false, false,
                       function(res){
                         assert.equal(_.isString(res.error), true);
                         done();
                       })
      })
      it('should give error message', function(done){
        var task = {Id:[],
                    DocPath:"Date.Now"};

        utils.query_cd(mp, task, false, false,
                       function(res){
                         assert.equal(_.isString(res.warn), true);
                         done();
                       })
      })
      it('should give error message', function(done){
        var task = {Id:["ca-test_doc_1"]};

        var data = {Result:[{Date:now}]},
            path = [0,0,0];

        utils.query_cd(mp, task, data, false,
                       function(res){
                         assert.equal(_.isString(res.error), true);
                         done();
                       })
      })

      it('should save the doc', function(done){

        var task = {Id:["ca-test_doc_1"],
                DocPath:"Date.Now"};

        var data = {Result:[{Date:now}]},
            path = [0,0,0];

        utils.query_cd(mp, task, path, data,
                       function(res){
                         assert.equal(res.ok, true);
                         done()
                       })
      })
    })
  })
})
