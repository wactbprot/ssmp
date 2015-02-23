var assert = require("assert")
  , _      = require("underscore")
  , clone  = require("clone")
  , utils  = require("../lib/utils")
  , net    = require("../lib/net")
  , deflt  = require("../lib/default")
  , caldoc = require("./caldoc")
  , ctrlstr  = deflt.ctrlStr;

describe('utils', function(){

if(false){
} // if false
  describe('#data_to_doc()', function(){
    it('should return error on empty data set', function(done){

      utils.data_to_doc(clone(caldoc), "Calibration", {},function(d){
        assert.equal(d.error, "wrong dataset structure");

        done();
      })
    })
  })

  describe('#data_to_doc()', function(){
    it('should return error on empty Result set', function(done){

      utils.data_to_doc(clone(caldoc), "Calibration", {Result:[]}, function(d){
        assert.equal(d.error, "wrong dataset structure");

        done();
      })
    })
  })

  describe('#data_to_doc()', function(){
    it('should set multible type, unit, value and comment structures', function(done){
      var path = "Calibration.Measurement.Values.Pressure"
        , dataset = { Result:
                      [ { Type: 'a', Unit: 'C', Value: null , Comment: "bla bla"},
                        { Type: 'b', Unit: 'C', Value: null , Comment: "bla bla"},
                        { Type: 'c', Unit: 'C', Value: null , Comment: "bla bla"},
                        { Type: 'd', Unit: 'C', Value: null , Comment: "bla bla"}
                        ] }
        , N = dataset.Result.length;

      utils.data_to_doc(clone(caldoc), path, dataset, function(d){
        assert.equal(d.Calibration.Measurement.Values.Pressure.length, N);

        for(var i in  d.Calibration.Measurement.Values.Pressure){
         var o = d.Calibration.Measurement.Values.Pressure[i];
          assert.equal(_.isNull(o.Value[0]), true);
          assert.equal(_.isString(o.Type), true);
          assert.equal(_.isString(o.Unit), true);
          if(i == N - 1){
            done();
          }
        }
      });
    })
  });

  describe('#data_to_doc()', function(){
    it('should set very deep paths', function(done){
      var path    = "a.s.d.f.g.h.j.k.l.o.i.u.z.t.r.f",
          dataset = {Result:[{Type:"test1",
                              Unit:"tu",
                              Value:123,
                              Comment:"comment1"}]};
      utils.data_to_doc({}, path, dataset, function(d){
        assert.equal(d.a.s.d.f.g.h.j.k.l.o.i.u.z.t.r.f[0].Value.length, 1);
        assert.equal(d.a.s.d.f.g.h.j.k.l.o.i.u.z.t.r.f[0].Value[0], 123);
        assert.equal(d.a.s.d.f.g.h.j.k.l.o.i.u.z.t.r.f[0].Comment[0],"comment1" );
        done();
      });
    })
  });

  describe('#data_to_doc()', function(){
    it('should set multible values to the same type', function(done){
      var path    = "Calibration.Measurement.Values.Pressure",
          dataset = {Result:[{Type:"test1",
                              Unit:"tu",
                              Value:123,
                              Comment:"comment1"}]};
      utils.data_to_doc(clone(caldoc), path, dataset, function(d){
        assert.equal(d.Calibration.Measurement.Values.Pressure[0].Value.length, 1);
        utils.data_to_doc(d, path, dataset, function(d){
          assert.equal(d.Calibration.Measurement.Values.Pressure[0].Value.length, 2);
          utils.data_to_doc(d, path, dataset, function(d){
            assert.equal(d.Calibration.Measurement.Values.Pressure[0].Value.length, 3);
            utils.data_to_doc(d, path, dataset, function(d){
              assert.equal(d.Calibration.Measurement.Values.Pressure[0].Value.length, 4);
              done();
            });
          });
        });
      });
    })
  });


  describe('#data_to_doc()', function(){
    it('should return error on wrong Result', function(done){

      utils.data_to_doc(clone(caldoc), "Calibration", {Result:[{Type:"d"}]}, function(d){
        assert.equal(d.error, "wrong data structure");
        done();
      })
    })
  })

  describe('#data_to_doc()', function(){
    it('should set one type, unit, value and comment structure', function(done){
      var dataset = {Result:[{Type:"test0",
                              Unit:"tu",
                              Value:123,
                              Comment:"comment0"}]}
        , path = "Calibration.Measurement.Values.Pressure";

      utils.data_to_doc(clone(caldoc), path, dataset, function(d){
        assert.equal(d.Calibration.Measurement.Values.Pressure[0].Value.length, 1);
        assert.equal(d.Calibration.Measurement.Values.Pressure[0].Value[0], 123);
        assert.equal(d.Calibration.Measurement.Values.Pressure[0].Comment[0],"comment0" );

        done();
      });
    })
  });

  describe('#data_to_doc()', function(){
    it('should set the kv structures given', function(done){

      var dataset = {Result:[{Gas:"N2"},
                             {operationKind:"opk1"}]},
          path    = "Calibration.Measurement.AuxValues.SequenceControl";

      utils.data_to_doc(clone(caldoc), path, dataset, function(d){
        assert.equal(d.Calibration.Measurement.AuxValues.SequenceControl.operationKind,"opk1");
        assert.equal(d.Calibration.Measurement.AuxValues.SequenceControl.Gas,"N2");
        done()
      });
    });
  });


});
