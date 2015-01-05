var assert = require("assert"),
    _      = require("underscore"),
    clone  = require("clone"),
    utils  = require("../lib/utils"),
    net    = require("../lib/net"),
    deflt  = require("../lib/default"),
    ctrlstr  = deflt.ctrlStr;

describe('utils', function(){

  describe('#data_to_doc()', function(){
    it('should return error struct', function(done){

      utils.data_to_doc(clone(caldoc), "Calibration", {},function(d){
        assert.equal(d.error, "wrong dataset structure");

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
    it('should set multible type, unit, value and comment structures', function(done){
      var path = "Calibration.Measurement.Values.Pressure"
        , dataset = { Result:
                      [ { Type: 'channel_101', Unit: 'C', Value: null },
                        { Type: 'sd_channel_101', Unit: 'C', Value: null },
                        { Type: 'N_channel_101', Unit: '1', Value: null },
                        { Type: 'channel_102', Unit: 'C', Value: null },
                        { Type: 'sd_channel_102', Unit: 'C', Value: null },
                        { Type: 'N_channel_102', Unit: '1', Value: null },
                        { Type: 'channel_103', Unit: 'C', Value: null },
                        { Type: 'sd_channel_103', Unit: 'C', Value: null },
                        { Type: 'N_channel_103', Unit: '1', Value: null },
                        { Type: 'channel_104', Unit: 'C', Value: null },
                        { Type: 'sd_channel_104', Unit: 'C', Value: null },
                        { Type: 'N_channel_104', Unit: '1', Value: null },
                        { Type: 'channel_105', Unit: 'C', Value: null },
                        { Type: 'sd_channel_105', Unit: 'C', Value: null },
                        { Type: 'N_channel_105', Unit: '1', Value: null },
                        { Type: 'channel_106', Unit: 'C', Value: null },
                        { Type: 'sd_channel_106', Unit: 'C', Value: null },
                        { Type: 'N_channel_106', Unit: '1', Value: null },
                        { Type: 'channel_107', Unit: 'C', Value: null },
                        { Type: 'sd_agilent107', Unit: 'C', Value: null },
                        { Type: 'N_channel_107', Unit: '1', Value: null },
                        { Type: 'channel_108', Unit: 'C', Value: null },
                        { Type: 'sd_agilentCh108', Unit: 'C', Value: null },
                        { Type: 'N_channel_108', Unit: '1', Value: null },
                        { Type: 'channel_109', Unit: 'C', Value: null },
                        { Type: 'sd_channel_109', Unit: 'C', Value: null },
                        { Type: 'N_channel_109', Unit: '1', Value: null },
                        { Type: 'channel_110', Unit: 'C', Value: null },
                        { Type: 'sd_channel_110', Unit: 'C', Value: null },
                        { Type: 'N_channel_110', Unit: '1', Value: null } ] };

      utils.data_to_doc(clone(caldoc), path, dataset, function(d){
        assert.equal(d.Calibration.Measurement.Values.Pressure.length, 30);

        for(var i in  d.Calibration.Measurement.Values.Pressure){
         var o = d.Calibration.Measurement.Values.Pressure[i];
          assert.equal(_.isNull(o.Value[0]), true);
          assert.equal(_.isString(o.Type), true);
          assert.equal(_.isString(o.Unit), true);
          if(i == 29){
            done();
          }
        }
      });
    })
  });

  describe('#data_to_doc()', function(){
    it('should set long paths', function(done){
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
  //      //
//      //      dataset[0].Value = 234;
//      //
//      //      utils.data_to_doc(doc, path, dataset,function(d){
//      //        assert.equal(d.dest.aim[0].Value.length, 2);
//      //        assert.equal(d.dest.aim[0].Value[1], 234);
//      //      } )
//      //
//      //      dataset[0].Type = "test2";
//      //      dataset[0].Comment = "comment2";
//      //
//      //      utils.data_to_doc(doc, path, dataset,function(d){
//      //        assert.equal(d.dest.aim[1].Value.length, 1);
//      //        assert.equal(d.dest.aim[1].Value[0], 234);
//      //        assert.equal(d.dest.aim[1].Comment[0],"comment2" );
//      //      } )
//      //
//      //      dataset[0].Value = 567;
//      //
//      //      utils.data_to_doc(doc, path, dataset,function(d){
//      //        assert.equal(d.dest.aim[1].Value.length, 2);
//      //        assert.equal(d.dest.aim[1].Value[1], 567);
//      //      } )
//      //    })
//    })
//  })
//  });
var caldoc = {
   "_id": "ca-test_doc_1",
   "_rev": "177-82d01037bff8029e7f7bb6d2310c8689",
   "Calibration": {
       "Sign": "9999_0003",
       "Type": "NN",
       "Year": "2014",
       "Standard": "CE3",
       "Presettings": {
           "Date": [
               {
                   "Value": "2014-05-26 11:50",
                   "Type": "generated"
               },
               {
                   "Type": "schedule",
                   "Duration": ""
               }
           ],
           "Customer": {
               "Lang": "de",
               "Name": "PTB AG7.54",
               "Sign": "PTB",
               "Type": "NMI",
               "DebitorenNr": "intern",
               "Adress": {
                   "Street": "Abbestr. 2-12",
                   "Town": "Berlin",
                   "Zipcode": "10587",
                   "Land": "Deutschland"
               },
               "Contact": {
                   "Name": "Dr. Karl Jousten",
                   "Phone": "++49-30-3481-7262",
                   "Fax": "++49-30-3481-7490",
                   "Mail": "karl.jousten@ptb.de"
               }
           },
           "ToDo": {
               "Name": "IG 3E-8 bis 9E-4 mbar (error)",
               "Sign": "IG-3E-8-9E-4",
               "Type": "error",
               "Gas": "N2",
               "Repeat": "1",
               "MaxDev": "0.1",
               "Values": {
                   "Pressure": {
                       "Type": "target",
                       "Unit": "mbar",
                       "Value": [
                           "3e-8",
                           "5e-8",
                           "9e-8",
                           "3e-7",
                           "5e-7",
                           "8.9e-7",
                           "9e-7",
                           "3e-6",
                           "5e-6",
                           "9e-6",
                           "3e-5",
                           "5e-5",
                           "9e-5",
                           "3e-4",
                           "5e-4",
                           "9e-4"
                       ]
                   }
               }
           }
       },
       "Measurement": {
           "CalibrationObject": [
               {
                   "Name": "CE3 SIG",
                   "Type": "Stabil Ion Gauge",
                   "Sign": "4814",
                   "Owner": {
                       "Name": "PTB AG7.54"
                   },
                   "Device": {
                       "Type": "SIG | GP360",
                       "Serial": "360120 | 97031709",
                       "Producer": "Granville-Phillips",
                       "Descriptions": "SIG Controller "
                   },
                   "Date": {
                       "Type": "generated",
                       "Value": "2011-05-09"
                   },
                   "Setup": {
                       "Display": "mbar",
                       "IG": "1",
                       "PressureRange": "L",
                       "Cathode": "1",
                       "Channel": "IG1"
                   },
                   "History": {
                       "2011-05-29": "Im Rahmen des bil. VG ans NIST gesandt",
                       "2013-01": "zurück vom NIST",
                       "2013-02": "erste Rekalib. zusammen mit CCFE"
                   },
                   "Uncertainty": [
                       {
                           "Type": "digit",
                           "Value": "0.01",
                           "Unit": "1",
                           "Comment": "Digitalisation resp. Resolution"
                       },
                       {
                           "Type": "uncertExpSd",
                           "Value": "0.01",
                           "Unit": "1",
                           "Comment": "Uncertainty due to experimental scatter"
                       },
                       {
                           "Type": "uncertGasPurity",
                           "Value": "0.005",
                           "Unit": "1",
                           "Comment": "Uncertainty caused by unpure gas"
                       },
                       {
                           "Type": "uncertOffsetDrift",
                           "Value": "1e-11",
                           "Unit": "mbar",
                           "Comment": "Uncertainty caused by offset drift (offset can not be measured while taking indication)"
                       },
                       {
                           "Type": "uncertOffset",
                           "Value": "1e-11",
                           "Unit": "mbar",
                           "Comment": "Uncertainty caused by offset scatter"
                       },
                       {
                           "Type": "uncertSync",
                           "Value": "0.001",
                           "Unit": "1",
                           "Comment": "Uncertainty caused t_qpV != t_pind"
                       }
                   ]
               },
               {
                   "Comment": "CDGB",
                   "Type": "398HD-01000 SP05",
                   "Sign": "4023",
                   "Name": "FM3_1000T",
                   "Owner": {
                       "Name": "PTB AG7.54"
                   },
                   "Device": {
                       "Serial": "33765-2",
                       "Producer": "MKS",
                       "LastCalibration": "QS 7/13",
                       "CalibrationIntervall": "24",
                       "MeasuredQuantity": "M+A",
                       "InventarNo": "94008769-0003",
                       "LocationBuilding": "Foe-Bau",
                       "LocationRoom": "24",
                       "Standard": "CE3",
                       "UsedFor": "pfill"
                   },
                   "Date": {
                       "Type": "updated",
                       "Value": "2013-06-07"
                   },
                   "Setup": {
                       "ZeroEnable": "on",
                       "Display": "mbar",
                       "Heater": "on",
                       "Average": "1"
                   },
                   "Uncertainty": [
                       {
                           "Type": "cdgb_u1_a",
                           "Value": "0.00022",
                           "Unit": "1",
                           "Comment": "relative Standardunsicherheit des Kalibrierdrucks während der Kalibrierung für Drücke > 30mbar",
                           "From": "1.3",
                           "To": "29.99",
                           "RangeUnit": "mbar"
                       },
                       {
                           "Type": "cdgb_u1_a",
                           "Value": "0.00013",
                           "Unit": "1",
                           "Comment": "relative Standardunsicherheit des Kalibrierdrucks während der Kalibrierung für Drücke < 30mbar",
                           "From": "30",
                           "To": "1300.0",
                           "RangeUnit": "mbar"
                       },
                       {
                           "Type": "cdgb_u2_a",
                           "Value": "0.0029",
                           "Unit": "mbar",
                           "Comment": "absolute Unsicherheit durch Digitalisierung im Bereich 133.0mbar bis 1300.0mbar",
                           "From": "133.0",
                           "To": "1300.0",
                           "RangeUnit": "mbar"
                       },
                       {
                           "Type": "cdgb_u2_b",
                           "Value": "0.00029",
                           "Unit": "mbar",
                           "Comment": "absolute Unsicherheit durch Digitalisierung im Bereich 1.3mbar bis 132.999mbar",
                           "From": "1.3",
                           "To": "132.99",
                           "RangeUnit": "mbar"
                       },
                       {
                           "Type": "cdgb_u3",
                           "Value": "0.0002",
                           "Unit": "1",
                           "Comment": "relative Langzeitstabilität bis zur nächsten Kalibrierfrist (2Jahre)"
                       },
                       {
                           "Type": "cdgb_u4_a",
                           "Value": "0.0008",
                           "Unit": "1",
                           "Comment": "relative Unsicherheit durch Nichtreproduzierbarkeit für Drücke < 200mbar",
                           "From": "1.3",
                           "To": "199.99",
                           "RangeUnit": "mbar"
                       },
                       {
                           "Type": "cdgb_u4_b",
                           "Value": "0.0001",
                           "Unit": "1",
                           "Comment": " relative Unsicherheit durch Nichtreproduzierbarkeit für Drücke > 200mbar",
                           "From": "200",
                           "To": "1300.0",
                           "RangeUnit": "mbar"
                       },
                       {
                           "Type": "cdgb_u5",
                           "Value": "0.0",
                           "Unit": "1",
                           "Comment": "relative Unsicherheit durch nicht erfassbare Nullpunktschwankungen"
                       }
                   ],
                   "Constant": [
                       {
                           "Type": "fullscale",
                           "Value": "1000",
                           "Unit": "Torr"
                       },
                       {
                           "Type": "cdgbCorrA",
                           "Value": "-1.1255315",
                           "Unit": "1",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgbCorrB",
                           "Value": "490.42154",
                           "Unit": "1/mbar",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgbCorrC",
                           "Value": "-0.24251923",
                           "Unit": "1/mbar",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgbCorrD",
                           "Value": "-2.1125578",
                           "Unit": "1/mbar^2",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgbCorrE",
                           "Value": "0.0024634774",
                           "Unit": "1/mbar^2",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgbCorrF",
                           "Value": "0.026910772",
                           "Unit": "1/mbar^3",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "useDev",
                           "From": "13.0",
                           "To": "1300.0",
                           "RangeUnit": "mbar",
                           "Comment": "Gültigkeitsbereich"
                       }
                   ],
                   "Defaults": {
                       "@host": "e75481",
                       "@device": "gpib0,9",
                       "@unt": "mbar",
                       "@acc": "VXI11",
                       "@docpath": "Calibration.Measurement.Values.Pressure",
                       "@repeat": 20,
                       "@waittime": 1000,
                       "@token": "fill",
                       "@unit": "mbar"
                   },
                   "Task": [
                       {
                           "TaskName": "is_ready",
                           "Comment": "Testet ob das Gerät ansprechbar ist",
                           "Action": "@acc",
                           "Host": "@host",
                           "Device": "@device",
                           "LogPriority": "3",
                           "Value": "*IDN?",
                           "PostProcessing": [
                               "var ok = _x == 'MKS INSTRUMENTS INC, MODEL 670, 0, SW Version 1.1',",
                               "ToExchange={'@exchpath':ok};"
                           ]
                       },
                       {
                           "TaskName": "device_ini",
                           "Comment": "Task klammert alle ini-Strings und führt per default die digit Einstellung durch.",
                           "Action": "@acc",
                           "Host": "@host",
                           "Device": "@device",
                           "VxiTimeout": 0,
                           "LogPriority": "3",
                           "Values": {
                               "unit_mbar": ":sens:scan(@1):puni MBAR",
                               "unit_torr": ":sens:scan(@1):puni TORR",
                               "no_aver": ":sens:scan(@1):aver 1",
                               "high_res": ":digit 5.5",
                               "meas_p": ":sens:func pres",
                               "high_range": ":sens:scan(@1):gain X1",
                               "med_range": ":sens:scan(@1):gain X0.1",
                               "low_range": ":sens:scan(@1):gain X0.01"
                           },
                           "Value": ":digit 5.5",
                           "PostProcessing": [
                               "ToExchange={'@exchpath':_x == null};"
                           ]
                       },
                       {
                           "TaskName": "read_out",
                           "Comment": "Druckauslese",
                           "Action": "@acc",
                           "Host": "@host",
                           "Device": "@device",
                           "LogPriority": "3",
                           "DocPath": "@docpath",
                           "lockDevice": false,
                           "Value": ":meas:func",
                           "Repeat": "@repeat",
                           "Wait": "@waittime",
                           "Fallback": {
                               "Result": [
                                   {
                                       "Type": "@token",
                                       "Value": null,
                                       "Unit": "@unit"
                                   },
                                   {
                                       "Type": "sd_@token",
                                       "Value": null,
                                       "Unit": "@unit"
                                   },
                                   {
                                       "Type": "N_@token",
                                       "Value": null,
                                       "Unit": "@unit"
                                   }
                               ],
                               "ToExchange": {
                                   "@exchpath.Value.value": null,
                                   "@exchpath.Unit.value": "@unit",
                                   "@exchpath.Type.value": "@token"
                               }
                           },
                           "PostProcessing": [
                               "var _vec=_x.map(_.extractMKSCDG).map(parseFloat),",
                               "RawData =_x,",
                               "_res = _.vlStat(_.checkNumArr(_vec).Arr),",
                               "Result=[_.vlRes('@token',_res.mv,'@unit'),",
                               "_.vlRes('sd_@token',_res.sd,'@unit'),",
                               "_.vlRes('N_@token',_res.N,'1')],",
                               "ToExchange={",
                               "'@exchpath.Value.value':_res.mv,",
                               "'@exchpath.Unit.value':'@unit',",
                               "'@exchpath.Type.value':'@token'",
                               "};"
                           ]
                       }
                   ]
               },
               {
                   "Type": "398HD-00010 SP05",
                   "Sign": "4022",
                   "Name": "FM3_10T",
                   "Owner": {
                       "Name": "PTB AG7.54"
                   },
                   "Device": {
                       "Serial": "33765-1",
                       "Producer": "MKS",
                       "LastCalibration": "QS 6/13",
                       "CalibrationIntervall": "24",
                       "MeasuredQuantity": "M+A",
                       "InventarNo": "94008769-0002",
                       "LocationBuilding": "Foe-Bau",
                       "LocationRoom": "24",
                       "Standard": "CE3",
                       "UsedFor": "pfill"
                   },
                   "Date": {
                       "Type": "updated",
                       "Value": "2014-08-15"
                   },
                   "Setup": {
                       "ZeroEnable": "on",
                       "Display": "mbar",
                       "Average": "1",
                       "Heater": "on"
                   },
                   "Uncertainty": [
                       {
                           "Type": "cdga_u1_a",
                           "Value": "0.00078",
                           "Unit": "1",
                           "Comment": "rel. Uns. d. Kalibrierdrucks im Bereich 0.013 mbar bis 9.99 mbar",
                           "From": "0.013",
                           "To": "9.99",
                           "RangeUnit": "mbar"
                       },
                       {
                           "Type": "cdga_u1_b",
                           "Value": "0.00023",
                           "Unit": "1",
                           "Comment": "rel. Uns. d. Kalibrierdrucks im Bereich 10 mbar bis 13 mbar",
                           "From": "10.0",
                           "To": "13.0",
                           "RangeUnit": "mbar"
                       },
                       {
                           "Type": "cdga_u2_a",
                           "Value": "0.0000029",
                           "Unit": "mbar",
                           "Comment": "abs. Uns. d. Digitalisierung für p<1.3mbar",
                           "From": "0.013",
                           "To": "1.299",
                           "RangeUnit": "mbar"
                       },
                       {
                           "Type": "cdga_u2_b",
                           "Value": "0.000029",
                           "Unit": "mbar",
                           "Comment": "abs. Uns. d. Digitalisierung für p>1.3mbar",
                           "From": "1.3",
                           "To": "13.0",
                           "RangeUnit": "mbar"
                       },
                       {
                           "Type": "cdga_u4",
                           "Value": "0.001",
                           "Unit": "1",
                           "Comment": "Langzeitstab. pro 2a"
                       },
                       {
                           "Type": "cdga_u5_a",
                           "Value": "0.0008",
                           "Unit": "1",
                           "Comment": "rel. Uns. d. Nichtreproduzierbarkeit",
                           "From": "0.13",
                           "To": "0.99",
                           "RangeUnit": "mbar"
                       },
                       {
                           "Type": "cdga_u5_b",
                           "Value": "0.0003",
                           "Unit": "1",
                           "Comment": "rel. Uns. d. nichterfassb. Nullpunktschw.",
                           "From": "1.0",
                           "To": "13.0",
                           "RangeUnit": "mbar"
                       },
                       {
                           "Type": "cdga_u6",
                           "Value": "0.00005",
                           "Unit": "1",
                           "Comment": "rel. Uns. durch Temperaturdifferenz (5e-5/K)"
                       },
                       {
                           "Type": "cdga_u7",
                           "Value": "0.000005",
                           "Unit": "mbar",
                           "Comment": "abs. Uns. d. nicht erfassbaren Nullpunktschwankung"
                       },
                       {
                           "Type": "cdga_u8",
                           "Value": "0.0",
                           "Unit": "1",
                           "Comment": "Abweichung von Fitkurve"
                       }
                   ],
                   "Constant": [
                       {
                           "Type": "fullscale",
                           "Value": "10",
                           "Unit": "Torr",
                           "Comment": "Kann zur ber. d. rangeabh. factors benutzt werden"
                       },
                       {
                           "Type": "cdgaCorrA_N2",
                           "Value": "0.028688827",
                           "Unit": "1",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^3)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrB_N2",
                           "Value": "15.801256",
                           "Unit": "1/mbar",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^3)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrC_N2",
                           "Value": "-0.013648996",
                           "Unit": "1/mbar",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^3)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrD_N2",
                           "Value": "153.25344",
                           "Unit": "1/mbar^2",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^3)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrE_N2",
                           "Value": "-0.49906842",
                           "Unit": "1/mbar^2",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^2)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrF_N2",
                           "Value": "1.6020308",
                           "Unit": "1/mbar^3",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^3)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrG_N2",
                           "Value": "0.0",
                           "Unit": "1/mbar^3",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^3)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrA_Ar",
                           "Value": "0.027487",
                           "Unit": "1",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^3)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrB_Ar",
                           "Value": "12.25051",
                           "Unit": "1/mbar",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^3)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrC_Ar",
                           "Value": "-0.066346385",
                           "Unit": "1/mbar",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^3)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrD_Ar",
                           "Value": "58.984373",
                           "Unit": "1/mbar^2",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^3)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrE_Ar",
                           "Value": "-0.18039466",
                           "Unit": "1/mbar^2",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^2)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrF_Ar",
                           "Value": "0.068294794",
                           "Unit": "1/mbar^3",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^3)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "cdgaCorrG_Ar",
                           "Value": "0.0",
                           "Unit": "1/mbar^3",
                           "Comment": "F(relativ)=(a+c*pind+e*pind^2+g*pind^3)/(1+b*pind+d*pind^2+f*pind^3)"
                       },
                       {
                           "Type": "useDev",
                           "From": "0.013",
                           "To": "12.99",
                           "RangeUnit": "mbar",
                           "Comment": "Gültigkeitsbereich"
                       }
                   ],
                   "Defaults": {
                       "@host": "e75481",
                       "@device": "gpib0,10",
                       "@unt": "mbar",
                       "@acc": "VXI11",
                       "@range": "X1",
                       "@token": "fill",
                       "@unit": "mbar",
                       "@exchpath": "FM3_10T.Value.value",
                       "@repeat": 10,
                       "@waittime": 1000
                   },
                   "Task": [
                       {
                           "TaskName": "is_ready",
                           "Comment": "Testet ob das Gerät ansprechbar ist",
                           "Action": "@acc",
                           "Host": "@host",
                           "Device": "@device",
                           "LogPriority": "3",
                           "Value": "*IDN?",
                           "PostProcessing": [
                               "var ok = _x == 'MKS INSTRUMENTS INC, MODEL 670, 0, SW Version 1.00',",
                               "ToExchange={'@exchpath':ok};"
                           ]
                       },
                       {
                           "TaskName": "device_ini",
                           "Comment": "Task klammert alle ini-Strings und führt per default die digit Einstellung durch.",
                           "Action": "@acc",
                           "Host": "@host",
                           "Device": "@device",
                           "VxiTimeout": 0,
                           "LogPriority": "3",
                           "Values": {
                               "unit_mbar": ":sens:scan(@1):puni MBAR",
                               "unit_torr": ":sens:scan(@1):puni TORR",
                               "no_aver": ":sens:scan(@1):aver 1",
                               "high_res": ":digit 5.5",
                               "meas_p": ":sens:func pres",
                               "high_range": ":sens:scan(@1):gain X1",
                               "med_range": ":sens:scan(@1):gain X0.1",
                               "low_range": ":sens:scan(@1):gain X0.01"
                           },
                           "Value": ":digit 5.5",
                           "PostProcessing": [
                               "ToExchange={'@exchpath':_x == null};"
                           ]
                       },
                       {
                           "TaskName": "read_out",
                           "Comment": "Druckauslese",
                           "Action": "@acc",
                           "Host": "@host",
                           "Device": "@device",
                           "LogPriority": "3",
                           "DocPath": "@docpath",
                           "lockDevice": false,
                           "Value": ":meas:func",
                           "Repeat": "@repeat",
                           "Wait": "@waittime",
                           "Fallback": {
                               "Result": [
                                   {
                                       "Type": "@token",
                                       "Value": null,
                                       "Unit": "@unit"
                                   },
                                   {
                                       "Type": "sd_@token",
                                       "Value": null,
                                       "Unit": "@unit"
                                   },
                                   {
                                       "Type": "N_@token",
                                       "Value": null,
                                       "Unit": "@unit"
                                   }
                               ],
                               "ToExchange": {
                                   "@exchpath.Value.value": null,
                                   "@exchpath.Unit.value": "@unit",
                                   "@exchpath.Type.value": "@token"
                               }
                           },
                           "PostProcessing": [
                               "var _vec=_x.map(_.extractMKSCDG).map(parseFloat),",
                               "RawData =_x,",
                               "_res = _.vlStat(_.checkNumArr(_vec).Arr),",
                               "Result=[_.vlRes('@token',_res.mv,'@unit'),",
                               "_.vlRes('sd_@token',_res.sd,'@unit'),",
                               "_.vlRes('N_@token',_res.N,'1')],",
                               "ToExchange={",
                               "'@exchpath.Value.value':_res.mv,",
                               "'@exchpath.Unit.value':'@unit',",
                               "'@exchpath.Type.value':'@token'",
                               "};"
                           ]
                       }
                   ],
                   "History": {
                       "2014-08-15": "Änderung des DB Namens (war CDG an FM3 10T) in der Datenbank mp_db"
                   }
               },
               {
                   "Type": "CDG",
                   "Sign": "4824",
                   "Name": "FM3_1T",
                   "Owner": {
                       "Name": "PTB AG7.54"
                   },
                   "Device": {
                       "Serial": "33765-2",
                       "Type": "398HD-01000 SP05",
                       "Producer": "MKS",
                       "InventarNo": "94008936-1",
                       "LocationBuilding": "Foe-Bau",
                       "LocationRoom": "24",
                       "Standard": "CE3",
                       "UsedFor": "delta_pfill"
                   },
                   "Date": {
                       "Type": "generated",
                       "Value": "2012-08-28"
                   },
                   "Setup": {
                       "Display": "mbar",
                       "Heater": "off",
                       "Average": "1"
                   },
                   "Defaults": {
                       "@host": "e75481",
                       "@device": "gpib0,8",
                       "@unit": "mbar",
                       "@waittime": "1000",
                       "@repeat": "10",
                       "@acc": "VXI11",
                       "@token": "drift",
                       "@docpath": "Calibration.Measurement.Values.Drift",
                       "@exchpath": "FM3_1T.Value.value"
                   },
                   "Task": [
                       {
                           "TaskName": "is_ready",
                           "Comment": "Testet ob das Gerät ansprechbar ist",
                           "Action": "@acc",
                           "Host": "@host",
                           "Device": "@device",
                           "LogPriority": "3",
                           "Value": "*IDN?",
                           "PostProcessing": [
                               "var ok = _x == 'MKS Instruments MKS670BD81 0 1.2',",
                               "ToExchange={'@exchpath':ok};"
                           ]
                       },
                       {
                           "TaskName": "device_ini",
                           "Comment": "Task klammert alle ini-Strings und führt per default die digit Einstellung durch.",
                           "Action": "@acc",
                           "Host": "@host",
                           "Device": "@device",
                           "VxiTimeout": 0,
                           "LogPriority": "3",
                           "Values": {
                               "unit_mbar": ":sens:scan(@1):puni MBAR",
                               "unit_torr": ":sens:scan(@1):puni TORR",
                               "no_aver": ":sens:scan(@1):aver 1",
                               "high_res": ":digit 5.5",
                               "meas_p": ":sens:func pres",
                               "high_range": ":sens:scan(@1):gain X1",
                               "med_range": ":sens:scan(@1):gain X0.1",
                               "low_range": ":sens:scan(@1):gain X0.01"
                           },
                           "Value": ":digit 5.5",
                           "PostProcessing": [
                               "ToExchange={'@exchpath':_x == null};"
                           ]
                       },
                       {
                           "TaskName": "read_out",
                           "Comment": "Druckauslese",
                           "Action": "@acc",
                           "Host": "@host",
                           "Device": "@device",
                           "lockDevice": false,
                           "LogPriority": "3",
                           "DocPath": "@docpath",
                           "Value": ":meas:func",
                           "Repeat": "@repeat",
                           "Wait": "@waittime",
                           "Fallback": {
                               "Result": [
                                   {
                                       "Type": "@token",
                                       "Value": null,
                                       "Unit": "@unit"
                                   },
                                   {
                                       "Type": "sd_@token",
                                       "Value": null,
                                       "Unit": "@unit"
                                   },
                                   {
                                       "Type": "N_@token",
                                       "Value": null,
                                       "Unit": "@unit"
                                   }
                               ],
                               "ToExchange": {
                                   "@exchpath.Value.value": null,
                                   "@exchpath.Unit.value": "@unit",
                                   "@exchpath.Type.value": "@token"
                               }
                           },
                           "PostProcessing": [
                               "var _vec=_x.map(_.extractMKSCDG).map(parseFloat),",
                               "RawData =_x,",
                               "_res = _.vlStat(_.checkNumArr(_vec).Arr),",
                               "Result=[_.vlRes('@token',_res.mv,'@unit'),",
                               "_.vlRes('sd_@token',_res.sd,'@unit'),",
                               "_.vlRes('N_@token',_res.N,'1')],",
                               "ToExchange={",
                               "'@exchpath.Value.value':_res.mv,",
                               "'@exchpath.Unit.value':'@unit',",
                               "'@exchpath.Type.value':'@token'",
                               "};"
                           ]
                       }
                   ],
                   "History": {
                       "2013-11-26": "springt während der Messung unvermittelt in mTorr Range",
                       "2014-05-20": "Änderung des DB Namens (war CDG an FM3 1T) in der Datenbank mp_db"
                   }
               },
               {
                   "Constant": [
                       {
                           "Type": "useDev",
                           "From": "293.15",
                           "To": "300.15",
                           "RangeUnit": "K",
                           "Comment": "Gültigkeitsbereich"
                       }
                   ],
                   "Date": {
                       "Type": "updated",
                       "Value": "2011-10-27"
                   },
                   "Defaults": {
                       "@acc": "VXI11",
                       "@host": "e75481",
                       "@device": "gpib0,5",
                       "@CR": "\n"
                   },
                   "Device": {
                       "Serial": "MY44042868",
                       "Producer": "Agilent/LKM",
                       "LastCalibration": "10/11",
                       "CalibrationIntervall": "12",
                       "Calibration": "QS 13/11",
                       "InventarNo": "94008818",
                       "LocationBuilding": "Foe-Bau",
                       "LocationRoom": "24",
                       "Standard": "CE3",
                       "UsedFor": "T"
                   },
                   "Name": "FM3_CE3-DMM_Agilent",
                   "Owner": {
                       "Name": "PTB AG7.54"
                   },
                   "Sign": "4833",
                   "Task": [
                       {
                           "TaskName": "is_ready",
                           "Comment": "Testet ob das Gerät ansprechbar ist",
                           "Action": "@acc",
                           "Host": "@host",
                           "Device": "@device",
                           "LogPriority": "3",
                           "Value": "*IDN?",
                           "PostProcessing": [
                               "var ok = _x == 'HEWLETT-PACKARD,34970A,0,13-2-2\\n',",
                               "ToExchange={'@exchpath':ok};"
                           ]
                       },
                       {
                           "TaskName": "device_ini",
                           "Comment": "Initialisierung des Messgeräts",
                           "Action": "@acc",
                           "Host": "@host",
                           "Device": "@device",
                           "LogPriority": "3",
                           "Value": "CONF:TEMP FRTD,91,1,MAX,(@101,102,103,104,105,106,107,108,109,110)@CRUNIT:TEMP C@CR*OPC?",
                           "PostProcessing": [
                               "var ok = _x == 1,",
                               "ToExchange={'@exchpath':ok};"
                           ]
                       }
                   ],
                   "Type": "34970A",
                   "Uncertainty": [
                       {
                           "Type": "agilent_u1",
                           "Value": "0.015",
                           "Unit": "K",
                           "Comment": "Uns. des Temperaturnormals"
                       },
                       {
                           "Type": "agilent_u2",
                           "Value": "0.000029",
                           "Unit": "K",
                           "Comment": "Digitalisierung"
                       },
                       {
                           "Type": "agilent_u3",
                           "Value": "0.02",
                           "Unit": "K",
                           "Comment": "Gradient ueber Al-Block, (Abschätzung)"
                       },
                       {
                           "Type": "agilent_u4",
                           "Value": "0.0",
                           "Unit": "K",
                           "Comment": "Temperaturabh. der Korrektur (war bei PP2 extrem ausgeprägt)"
                       },
                       {
                           "Type": "agilent_u5",
                           "Value": "0.2",
                           "Unit": "K",
                           "Comment": "Langzeitstab. pro Jahr (war 0.3 auf 2a); Erfahrung fehlt noch"
                       },
                       {
                           "Type": "agilent_u6",
                           "Value": "0.08",
                           "Unit": "K",
                           "Comment": "experimentelle Streuung bei der Kalib."
                       }
                   ],
                   "History": {
                       "2011-10-27": "Neue Temperaturfuehler fuer CE3 an Agilent Scanner und neue PT100, liefert seit 27.10.11 Unsicherheit für CE3/FM3"
                   }
               }
           ],
           "SequenceControl": {
               "calPort": "P3",
               "Gas": "Ar",
               "operationKind": "opK4"
           },
           "Standard": {
               "Comment": "Veränderungen durch QSE-FM3-13-1 eingetragebetet",
               "Maintainer": "bock04",
               "Name": "CE3",
               "Date": {
                   "Type": "update",
                   "Value": "2013-10-25"
               },
               "Uncertainty": [
                   {
                       "Type": "fm3Pres_u1",
                       "Value": "2.5e-7",
                       "Unit": "mbar",
                       "Comment": "wie in QSE-FM3-13-1 angegeben",
                       "From": "0.0001",
                       "To": "500",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3ConstCSlope_u1",
                       "Value": "6.11e-9",
                       "Unit": "l/mbar/s",
                       "Comment": "wie in QSE-FM3-13-1",
                       "From": "0.0001",
                       "To": "0.1",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3ConstCIntercept_u2",
                       "Value": "1.58e-9",
                       "Unit": "l/s",
                       "Comment": "wie in QSE-FM3-13-1",
                       "From": "0.0001",
                       "To": "0.1",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3ConstCDeltat_u5",
                       "Value": "0.004",
                       "Unit": "1",
                       "Comment": "wie in QSE-FM3-13-1",
                       "From": "0.0001",
                       "To": "0.1",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3ConstCDeltaV_u4",
                       "Value": "0.0003",
                       "Unit": "1",
                       "Comment": "wie in QSE-FM3-13-1",
                       "From": "0.0001",
                       "To": "0.1",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3ConstCsdRes_u6",
                       "Value": "0.014",
                       "Unit": "1",
                       "Comment": "wie in QSE-FM3-13-1",
                       "From": "0.0001",
                       "To": "0.1",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3ThermTrans_u1",
                       "Value": "0.25",
                       "Unit": "1",
                       "Comment": "25% therm. Transp bei 10Pa, s. /mediawiki/index.php5/QSE-FM3-98_10#Unsicherheiten_durch_Abweichen_des_tatsächlichen_Drucks_vom_gemessen_Druck",
                       "From": "0.0001",
                       "To": "0.3",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3DeltaV_u2_a",
                       "Value": "4.0e-5",
                       "Unit": "g",
                       "Comment": "Unsicherheit der Kalibrierung/Berechnung von DeltaV Gewichtsmessung Wasser im Verdränger bezieht sich auf Values deltaG"
                   },
                   {
                       "Type": "fm3DeltaV_u2_b",
                       "Value": "1.2e-4",
                       "Unit": "1",
                       "Comment": "Unsicherheit der Kalibrierung/Berechnung von DeltaV Gewichtsmessung Wasser im Verdränger"
                   },
                   {
                       "Type": "fm3DeltaV_u2_c",
                       "Value": "5.0e-5",
                       "Unit": "g",
                       "Comment": "Unsicherheit der Kalibrierung/Berechnung von DeltaV u_Verdunstung bezieht sich auf Values deltaG"
                   },
                   {
                       "Type": "fm3DeltaV_u2_d",
                       "Value": "2.5e-5",
                       "Unit": "1",
                       "Comment": "Unsicherheit Dichte Wasser"
                   },
                   {
                       "Type": "fm3DeltaV_u2_e",
                       "Value": "9.6e-5",
                       "Unit": "1",
                       "Comment": "Unsicherheit der Kalibrierung/Berechnung von DeltaV Unsicherheit Delta l s. Gleichung 21 (war in UNSFM3.FOR91 so impl.)"
                   },
                   {
                       "Type": "fm3DeltaV_u2_f",
                       "Value": "2.0e-4",
                       "Unit": "1",
                       "Comment": "Unsicherheit der Kalibrierung/Berechnung von DeltaV Diff. auss-innen Verdr. Gl. (22)"
                   },
                   {
                       "Type": "fm3DeltaV_u2_g",
                       "Value": "1.0e-8",
                       "Unit": "1",
                       "Comment": "relative Unsicherheit der Erdbeschleunigung g"
                   },
                   {
                       "Type": "fm3Deltat_u1",
                       "Value": "0.0",
                       "Unit": "1",
                       "Comment": "zufälliger Anteil der Drift Gleichungen 28"
                   },
                   {
                       "Type": "fm3Deltat_u2",
                       "Value": "6.4e-4",
                       "Unit": "1",
                       "Comment": "Instab. der Drift bis 10Pa Gleichung 29-1",
                       "From": "0.013",
                       "To": "0.999",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3DeltatLw1_u3_a",
                       "Value": "6.4e-4",
                       "Unit": "1",
                       "Comment": "Instab. der Drift ab 10Pa Gleichung 29-2 1.Term, LW1, Range bezogen auf pfill",
                       "From": "1.0",
                       "To": "1300.0",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3DeltatLw1_u3_b",
                       "Value": "2.0e-4",
                       "Unit": "1",
                       "Comment": "Instab. der Drift ab 10Pa Gleichung 29-2 2. Term, Vorfaktor ist log(p/.1mbar), LW1, Range bezogen auf pfill",
                       "From": "1.0",
                       "To": "1300.0",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3DeltatLw2_u3",
                       "Value": "4.0e-3",
                       "Unit": "1",
                       "Comment": "Instab. der Drift Gleichung 29-3 LW2, Range bezogen auf pfill",
                       "From": "0.013",
                       "To": "1300.0",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3DeltaVDeltatLw1_u1",
                       "Value": "1.3e-3",
                       "Unit": "1",
                       "Comment": "Unsicherheit von Dv/Dt Gleichung 30"
                   },
                   {
                       "Type": "fm3DeltaVDeltatLw2_u1_a",
                       "Value": "1.3e-3",
                       "Unit": "1",
                       "Comment": "Unsicherheit von Dv/Dt Gleichung 30",
                       "From": "0.01",
                       "To": "0.999",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3DeltaVDeltatLw2_u1_b",
                       "Value": "1.2e-3",
                       "Unit": "1",
                       "Comment": "Unsicherheit von Dv/Dt Gleichung 30 Faktor fuer log(1mpar/po)",
                       "From": "0.01",
                       "To": "0.999",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3DeltaVDeltatLw2_u1_c",
                       "Value": "2.7e-3",
                       "Unit": "1",
                       "Comment": "s. wiki FM3: Unsicherheit der Volumenänderung pro Zeitschritt",
                       "From": "1.0",
                       "To": "150.0",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "fm3Tfm_u1",
                       "Value": "0",
                       "Unit": "K",
                       "Comment": "Temperaturbestimmung am Messort"
                   },
                   {
                       "Type": "fm3Tfm_u2",
                       "Value": "0.1",
                       "Unit": "K",
                       "Comment": "Abweichung Gastemp. (Innen/Aussen)"
                   },
                   {
                       "Type": "fm3Tfm_u3",
                       "Value": "0.05",
                       "Unit": "K",
                       "Comment": "Drift LW-Messung/T-Messung"
                   },
                   {
                       "Type": "ce3Tch_u1",
                       "Value": "0",
                       "Unit": "K",
                       "Comment": "Auflösung"
                   },
                   {
                       "Type": "ce3Tch_u2",
                       "Value": "0.2",
                       "Unit": "K",
                       "Comment": "Abweichung Gastemp. (Innen/Aussen)"
                   },
                   {
                       "Type": "ce3C1_u1_a",
                       "Value": "4.5e-4",
                       "Unit": "1",
                       "Comment": "s. /mediawiki/index.php5/Unsicherheit_CE3#Unsicherheit der Leitwertterme"
                   },
                   {
                       "Type": "ce3C2_u1",
                       "Value": "3.4e-4",
                       "Unit": "1",
                       "Comment": "s. /mediawiki/index.php5/Unsicherheit_CE3#Unsicherheit der Leitwertterme"
                   },
                   {
                       "Type": "ce3C02_u1",
                       "Value": "5.2e-4",
                       "Unit": "l/s",
                       "Comment": "s. /mediawiki/index.php5/Unsicherheit_CE3#Unsicherheit der Leitwertterme"
                   },
                   {
                       "Type": "ce3C1_u1_b",
                       "Value": "10.0",
                       "Unit": "1/mbar",
                       "Comment": "s. /mediawiki/index.php5/Unsicherheit_CE3#Unsicherheit von C_1"
                   },
                   {
                       "Type": "ce3C01_u1_a",
                       "Value": "2.1e-2",
                       "Unit": "l/s",
                       "Comment": "s. /mediawiki/index.php5/Unsicherheit_CE3#Unsicherheit der Leitwertterme"
                   },
                   {
                       "Type": "ce3C01_u1_b",
                       "Value": "12.61",
                       "Unit": "1/mbar",
                       "Comment": "ist mit qpV multipl. abs. Uns."
                   },
                   {
                       "Type": "ce3qsplit_u1_a",
                       "Value": "2.5e-4",
                       "Unit": "1",
                       "Comment": "Wert für OPK1,2,4; s. wiki: Unsicherheit_CE3#Unsicherheit_der_Flussaufteilung"
                   },
                   {
                       "Type": "ce3qsplit_u1_b",
                       "Value": "2.5e-2",
                       "Unit": "1",
                       "Comment": "Wert für OPK3; s. wiki: Unsicherheit_CE3#Unsicherheit_der_Flussaufteilung"
                   },
                   {
                       "Type": "ce3F_u1",
                       "Value": "1e-4",
                       "Unit": "1",
                       "Comment": "Korrektur Flanschort"
                   }
               ],
               "Constants": [
                   {
                       "Type": "turn_2_mm",
                       "Value": "1.01615",
                       "Unit": "mm/turn",
                       "Comment": "Nachgemessene Steigung der Mikrometerschraube. s. Lab.buch&wiki"
                   },
                   {
                       "Type": "fbv_A",
                       "Value": "-4.3426e-3",
                       "Unit": "1",
                       "Comment": "Wert aus fm3.h"
                   },
                   {
                       "Type": "fbv_B",
                       "Value": "-17.8823",
                       "Unit": "mm",
                       "Comment": "Wert aus fm3.h"
                   },
                   {
                       "Type": "fbv_C",
                       "Value": "111.559",
                       "Unit": "mm^2",
                       "Comment": "Wert aus fm3.h"
                   },
                   {
                       "Type": "dv2MolCIntercept",
                       "Value": "8.491e-07",
                       "Unit": "l/s",
                       "Comment": "s. QSE-FM3-13-1"
                   },
                   {
                       "Type": "dv2MolCSlope",
                       "Value": "-4.95e-8",
                       "Unit": "l/s/mbar",
                       "Comment": "s. QSE-FM3-13-1 "
                   },
                   {
                       "Type": "r1",
                       "Value": "0.016751",
                       "Unit": "m",
                       "Comment": "Blendenradius C1 in m nach QSE-CE3-98"
                   },
                   {
                       "Type": "r2",
                       "Value": "0.016521",
                       "Unit": "m",
                       "Comment": "Blendenradius C2 in m nach QSE-CE3-98"
                   },
                   {
                       "Type": "qSplitCorrUhvOpk1A",
                       "Value": "0.98924",
                       "Unit": "1",
                       "Comment": "a+ qpv*b + qpv^2 =fdCorrection UHV opK1, s. auch http://a73434.berlin.ptb.de/vacLab/index.php5/Neue_FD-_Korrektur"
                   },
                   {
                       "Type": "qSplitCorrUhvOpk1B",
                       "Value": "0.026632",
                       "Unit": "1/(mbar l/s)",
                       "Comment": "a+ qpv*b + qpv^2 =fdCorrection UHV opK1, s. auch http://a73434.berlin.ptb.de/vacLab/index.php5/Neue_FD-_Korrektur"
                   },
                   {
                       "Type": "qSplitCorrUhvOpk1C",
                       "Value": "-0.25902",
                       "Unit": "1/(mbar l/s)^2",
                       "Comment": "a+ qpv*b + qpv^2 =fdCorrection UHV opK1, s. auch http://a73434.berlin.ptb.de/vacLab/index.php5/Neue_FD-_Korrektur"
                   },
                   {
                       "Type": "qSplitCorrUhvOpk2A",
                       "Value": "0.98923",
                       "Unit": "1",
                       "Comment": "a+ qpv*b + qpv^2 =fdCorrection UHV opK2, s. auch http://a73434.berlin.ptb.de/vacLab/index.php5/Neue_FD-_Korrektur"
                   },
                   {
                       "Type": "qSplitCorrUhvOpk2B",
                       "Value": "0.026675",
                       "Unit": "1/(mbar l/s)",
                       "Comment": "a+ qpv*b + qpv^2 =fdCorrection UHV opK2, s. auch http://a73434.berlin.ptb.de/vacLab/index.php5/Neue_FD-_Korrektur"
                   },
                   {
                       "Type": "qSplitCorrUhvOpk2C",
                       "Value": "-0.25943",
                       "Unit": "1/(mbar l/s)^2",
                       "Comment": "a+ qpv*b + qpv^2 =fdCorrection UHV opK2, s. auch http://a73434.berlin.ptb.de/vacLab/index.php5/Neue_FD-_Korrektur"
                   },
                   {
                       "Type": "qSplitCorrXhvOpk3A",
                       "Value": "0.010773",
                       "Unit": "1",
                       "Comment": "a+ qpv*b + qpv^2 =fdCorrection XHV opK3, s. auch http://a73434.berlin.ptb.de/vacLab/index.php5/Neue_FD-_Korrektur"
                   },
                   {
                       "Type": "qSplitCorrXhvOpk3B",
                       "Value": "-0.026675",
                       "Unit": "1/(mbar l/s)",
                       "Comment": "a+ qpv*b + qpv^2 =fdCorrection XHV opK3, s. auch http://a73434.berlin.ptb.de/vacLab/index.php5/Neue_FD-_Korrektur"
                   },
                   {
                       "Type": "qSplitCorrXhvOpk3C",
                       "Value": "0.25943",
                       "Unit": "1/(mbar l/s)^2",
                       "Comment": "a+ qpv*b + qpv^2 =fdCorrection XHV opK3, s. auch http://a73434.berlin.ptb.de/vacLab/index.php5/Neue_FD-_Korrektur"
                   },
                   {
                       "Type": "aK2",
                       "Value": "0.08",
                       "Unit": "1",
                       "Comment": "Faktor Blendenkorrektur der mittleren freien Weglaenge"
                   },
                   {
                       "Type": "K3Uhv",
                       "Value": "0.99776",
                       "Unit": "1",
                       "Comment": "Blendendicke und Halter (9.11.98)"
                   },
                   {
                       "Type": "K3Xhv",
                       "Value": "0.99867",
                       "Unit": "1",
                       "Comment": "Blendendicke und Halter (9.11.98)"
                   },
                   {
                       "Type": "K4P1",
                       "Value": "0.99851",
                       "Unit": "1",
                       "Comment": "(1 -1.49e-3) ,## Korrektur des MessPorts 3 der Uhv-Kammer zusammen mit Verlust d. Blende,Metrologia(1999;36(6):561) "
                   },
                   {
                       "Type": "K4P2",
                       "Value": "0.99806",
                       "Unit": "1",
                       "Comment": "(1 -1.94e-3) , ## Korrektur des MessPorts 3 der Uhv-Kammer zusammen mit Verlust d. Blende,Metrologia(1999;36(6):561)"
                   },
                   {
                       "Type": "K4P3",
                       "Value": "0.99671",
                       "Unit": "1",
                       "Comment": "(1 - 3.29e-3) , ## Korrektur des MessPorts 3 der Uhv-Kammer zusammen mit Verlust d. Blende,Metrologia(1999;36(6):561)"
                   },
                   {
                       "Type": "K4P4",
                       "Value": "0.9888",
                       "Unit": "1",
                       "Comment": "nach Szwemin, Korrektur des MessPorts der Xhv-Kammer"
                   },
                   {
                       "Type": "nomC1",
                       "Value": "0.10426",
                       "Unit": "m^3/s",
                       "Comment": "Leitwert C1 nach QSE-CE3-98 (S.11)"
                   },
                   {
                       "Type": "nomC2",
                       "Value": "0.10142",
                       "Unit": "m^3/s",
                       "Comment": "Leitwert C2 nach QSE-CE3-98"
                   },
                   {
                       "Type": "deltaG",
                       "Value": "0.5",
                       "Unit": "g",
                       "Comment": "Bezugswassermenge bei der Bestimmung von DeltaV des Verdrängers"
                   },
                   {
                       "Type": "useLw1",
                       "Comment": "Lw1 bezeichnet grossen Leitwert; s. QSE-FM3-13-1",
                       "From": "1.0e-5",
                       "To": "3.0e-5",
                       "RangeUnit": "l/s"
                   },
                   {
                       "Type": "useLw2",
                       "Comment": "Lw2 bezeichnet kleinen Leitwert; s. QSE-FM3-13-1",
                       "From": "1.0e-8",
                       "To": "6.0e-6",
                       "RangeUnit": "l/s"
                   },
                   {
                       "Type": "useLwC",
                       "Comment": "LwC ist der constLw wie in QSE-FM3-13-1 beschrieben; Range bezieht sich auf Fülldruck",
                       "From": "0.00013",
                       "To": "0.1",
                       "RangeUnit": "mbar"
                   },
                   {
                       "Type": "nomC02",
                       "Value": "0.0000536",
                       "Unit": "m^3/s",
                       "Comment": "s.mediawiki/index.php5/Neubestimmung_der_Blende_C_02"
                   },
                   {
                       "Type": "c01Slope",
                       "Value": "0.0126",
                       "Unit": "1/mbar",
                       "Comment": "s. mediawiki/index.php5/Neubestimmung_der_Blende_C_01"
                   },
                   {
                       "Type": "c01Intercept",
                       "Value": "0.005206",
                       "Unit": "m^3/s",
                       "Comment": "mediawiki/index.php5/Neubestimmung_der_Blende_C_01"
                   },
                   {
                       "Type": "grLw_Ar_A",
                       "Value": "1.0165476e-5",
                       "Unit": "l/s",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "grLw_Ar_B",
                       "Value": "3.95698e-8",
                       "Unit": "1",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "grLw_Ar_C",
                       "Value": "-6.1832e-7",
                       "Unit": "1",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "grLw_Ar_D",
                       "Value": "0.0005833",
                       "Unit": "1",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "grLw_N2_A",
                       "Value": "1.19e-5",
                       "Unit": "l/s",
                       "Comment": "nach QSE-CE3-13-1"
                   },
                   {
                       "Type": "grLw_N2_B",
                       "Value": "4.80e-8",
                       "Unit": "1",
                       "Comment": "nach QSE-CE3-13-1"
                   },
                   {
                       "Type": "grLw_N2_C",
                       "Value": "-7.41e-7",
                       "Unit": "1",
                       "Comment": "nach QSE-CE3-13-1"
                   },
                   {
                       "Type": "grLw_N2_D",
                       "Value": "3.98e-4",
                       "Unit": "1",
                       "Comment": "nach QSE-FM3-13-1"
                   },
                   {
                       "Type": "klLw_N2_A",
                       "Value": "8.20e-7",
                       "Unit": "l/s",
                       "Comment": "nach QSE-FM3-13-1"
                   },
                   {
                       "Type": "klLw_N2_B",
                       "Value": "1.09e-9",
                       "Unit": "1",
                       "Comment": "nach QSE-FM3-13-1"
                   },
                   {
                       "Type": "klLw_N2_C",
                       "Value": "-6.21e-8",
                       "Unit": "1",
                       "Comment": "nach QSE-FM3-13-1"
                   },
                   {
                       "Type": "klLw_N2_D",
                       "Value": "-6.73e-8",
                       "Unit": "1",
                       "Comment": "nach QSE-FM3-13-1"
                   },
                   {
                       "Type": "klLw_Ar_A",
                       "Value": "7.017796e-7",
                       "Unit": "l/s",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "klLw_Ar_B",
                       "Value": "7.8552137e-10",
                       "Unit": "1",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "klLw_Ar_C",
                       "Value": "-4.353719e-8",
                       "Unit": "1",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "klLw_Ar_D",
                       "Value": "3.982730e-7",
                       "Unit": "1",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "klLw_D2_A",
                       "Value": "2.6168324e-6",
                       "Unit": "l/s",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "klLw_D2_B",
                       "Value": "3.093108e-9",
                       "Unit": "1",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "klLw_D2_C",
                       "Value": "-2.614099e-7",
                       "Unit": "1",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "klLw_D2_D",
                       "Value": "-8.97752e-7",
                       "Unit": "1",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "grLw_D2_A",
                       "Value": "3.313154e-5",
                       "Unit": "l/s",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "grLw_D2_B",
                       "Value": "7.263111e-8",
                       "Unit": "1",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "grLw_D2_C",
                       "Value": "-2.0044355e-6",
                       "Unit": "1",
                       "Comment": "s.map"
                   },
                   {
                       "Type": "grLw_D2_D",
                       "Value": "0.0039600339",
                       "Unit": "1",
                       "Comment": "s.map"
                   }
               ],
               "AuxObject": [
                   {
                       "Comment": "Corvus Motorsteuerung an CE3 für DV1 und DV2",
                       "Name": "Corvus_1",
                       "Standard": "CE3",
                       "Type": "Motorsteuerung",
                       "Date": {
                           "Type": "generated",
                           "Value": "2011-06-22"
                       },
                       "Defaults": {
                           "@host": "e75468",
                           "@port": "23",
                           "@CR": "\\r"
                       },
                       "Device": {
                           "SerNr": "1105056",
                           "Producer": "ITK Dr. Kassen GmbH",
                           "InvNr": "99080444/21",
                           "LocationBuilding": "Foe-Bau ",
                           "LocationRoom": "9",
                           "Type": "8064-12"
                       },
                       "Owner": {
                           "Name": "PTB AG 7.54"
                       },
                       "Task": [
                           {
                               "TaskName": "is_ready",
                               "Comment": "Testet status des Geräts",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "status@CR",
                               "PostProcessing": [
                                   "var val = parseInt(_x,10);",
                                   "ToExchange={'@exchpath': val == 0};"
                               ]
                           },
                           {
                               "TaskName": "open_grLW_exe",
                               "Comment": "Öffnet großen Leitwert (10 Umdr.)",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "1.8 sv@CR0 10 0 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "close_grLW_exe",
                               "Comment": "schließt großen Leitwert (10 Umdr.)",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "1.8 sv@CR0 -10 0 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "open_klLW_exe",
                               "Comment": "öffnet kleinen Leitwert (10 Umdr.)",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "1.8 sv@CR0 0 10 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "close_klLW_exe",
                               "Comment": "schließt kleinen Leitwert (10 Umdr.)",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "1.8 sv@CR0 0 -10 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "klLW_startpos",
                               "Comment": "Task liefert die Position des kleinen LW-Ventils.",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Timeout": "10000",
                               "Value": " pos @CR",
                               "StopIf": "klLw_start_position",
                               "PostProcessing": [
                                   "var _pos = parseFloat(_x.split('\\n')[1]),",
                                   "Value = {klLw_start_position : (_pos < 0.01 && _pos > -0.01)};"
                               ]
                           },
                           {
                               "TaskName": "grLW_startpos",
                               "Comment": "Task liefert die Position des kleinen LW-Ventils.",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Timeout": "10000",
                               "Value": " pos @CR",
                               "StopIf": "grLw_start_position",
                               "PostProcessing": [
                                   "var _pos = parseFloat(_x.split('\\n')[0]),",
                                   "Value = {grLw_start_position : (_pos < 0.01 && _pos > -0.01)};"
                               ]
                           }
                       ]
                   },
                   {
                       "Comment": "Corvus Motorsteuerung an CE3 für DVG1 und FBV",
                       "Date": {
                           "Type": "generated",
                           "Value": "2011-06-22"
                       },
                       "Defaults": {
                           "@host": "e75469",
                           "@port": "23",
                           "@CR": "\\r"
                       },
                       "Device": {
                           "SerNr": "1105056",
                           "Producer": "ITK Dr. Kassen GmbH",
                           "InvNr": "99080444/21",
                           "LocationBuilding": "Foe-Bau ",
                           "LocationRoom": "9",
                           "Type": "8064-12"
                       },
                       "Name": "Corvus_2",
                       "Owner": {
                           "Name": "PTB AG 7.54"
                       },
                       "Standard": "CE3",
                       "Task": [
                           {
                               "TaskName": "is_ready",
                               "Comment": "Testet status des Geräts",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "status@CR",
                               "PostProcessing": [
                                   "var val = parseInt(_x,10);",
                                   "ToExchange={'@exchpath': val == 0};"
                               ]
                           },
                           {
                               "TaskName": "open_dvg1_exe",
                               "Comment": "Task öffnet Dosierventil DVG1 (10 Umdrehungen)",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "1.8 sv@CR0 10 0 r@CR0 0 0 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "close_dvg1_exe",
                               "Comment": "Task schließt Dosierventil DVG1 (10 Umdrehungen)",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "1.8 sv@CR0 -10 0 r@CR0 0 0 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "displacer_20_in_exe",
                               "Comment": "Task fährt den Verdränger 20 Umdrehungen im Uhrzeigersinn",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "0.8 sv@CR0 0 -20 r@CR0 0 0 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "displacer_20_out_exe",
                               "Comment": "Task fährt den Verdränger 20 Umdrehungen gegen Uhrzeigersinn",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "0.8 sv@CR0 0 20 r@CR0 0 0 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "displacer_pos_exe",
                               "Comment": "Task liefert die Verdrängerposition",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": " pos @CR",
                               "ReadDefaultFrom": "select_pfill",
                               "DocPath": "Calibration_Measurement_AuxValues_Conductance",
                               "PostProcessing": [
                                   "var _identif = mp_no,",
                                   " Result=[",
                                   "{'Type':'turn_'+_identif,'Value':parseFloat(_x.split('\\n')[1]),'Unit':'1'}];"
                               ]
                           },
                           {
                               "TaskName": "displacer_0.1_in_exe",
                               "Comment": "Verdränger 0.1 rein",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "0.8 sv@CR0 0 -0.1 r@CR0 0 0 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "displacer_0.1_out_exe",
                               "Comment": "Verdränger 0.1 raus",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "0.8 sv@CR0 0 0.1 r@CR0 0 0 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "displacer_grLw_in_exe",
                               "Comment": "Verdränger 5.06 rein",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "0.98 sv@CR0 0 -5.06 r@CR0 0 0 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "displacer_grLw_out_exe",
                               "Comment": "Verdränger 5.06 raus",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "0.98 sv@CR0 0 5.06 r@CR0 0 0 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "displacer_klLw_in_exe",
                               "Comment": "Verdränger 0.665 rein",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "0.98 sv@CR0 0 -0.665 r@CR0 0 0 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "displacer_klLw_out_exe",
                               "Comment": "Verdränger 0.665 raus",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": "0.98 sv@CR0 0 0.665 r@CR0 0 0 r@CR1 getpitch@CR"
                           },
                           {
                               "TaskName": "displacer_startpos",
                               "Comment": "Task liefert die Verdrängerposition; entscheidet ob mit LW-Messung begonnen werden kann.",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": " pos @CR",
                               "StopIf": "displacer_start_position",
                               "PostProcessing": [
                                   "var _pos = parseFloat(_x.split('\\n')[1]),",
                                   "Value = {displacer_start_position : (_pos < 0.01 && _pos > -0.01)};"
                               ]
                           },
                           {
                               "TaskName": "dvg1_startpos",
                               "Comment": "Task liefert die Verdrängerposition; entscheidet ob mit LW-Messung begonnen werden kann.",
                               "Action": "TCP",
                               "Host": "@host",
                               "Port": "@port",
                               "Value": " pos @CR",
                               "StopIf": "dvg1_start_position",
                               "PostProcessing": [
                                   "var _pos = parseFloat(_x.split('\\n')[0]),",
                                   "Value = {dvg1_start_position : (_pos < 0.01 && _pos > -0.01)};"
                               ]
                           }
                       ],
                       "Type": "Motorsteuerung"
                   }
               ]
           }
       },
       "Constants": {
           "Date": {
               "Type": "update",
               "Value": "2012-09-13"
           },
           "Values": [
               {
                   "Type": "referenceTemperature",
                   "Value": 296.15,
                   "Unit": "K",
                   "Comment": "reference Temperatur"
               },
               {
                   "Type": "standardPressure",
                   "Value": 101.3,
                   "Unit": "kPa",
                   "Comment": "standard atmo pressure"
               },
               {
                   "Type": "standardVolumen",
                   "Value": 24450,
                   "Unit": "cm^3",
                   "Comment": "Standard Volumen bei 25C"
               },
               {
                   "Type": "molWeight_N2",
                   "Value": 0.0280134,
                   "Unit": "kg/mol",
                   "Comment": "molecular weight nitrogen"
               },
               {
                   "Type": "molWeight_Ne",
                   "Value": 0.020179,
                   "Unit": "kg/mol",
                   "Comment": "molecular weight neon"
               },
               {
                   "Type": "molWeight_He",
                   "Value": 0.0040026,
                   "Unit": "kg/mol",
                   "Comment": "molecular weight helium"
               },
               {
                   "Type": "molWeight_D2",
                   "Value": 0.0040029,
                   "Unit": "kg/mol",
                   "Comment": "molecular weight deuterium; von http://www.linde-gase.de/datenblatt/db_deuterium_stabiles-wasserstoff-isotop.pdf"
               },
               {
                   "Type": "molWeight_CO",
                   "Value": 0.02801,
                   "Unit": "kg/mol",
                   "Comment": "Kohlenmonoxid; von http://www.linde-gase.de/datenblatt/db_kohlenmonoxid_4.7.pdf"
               },
               {
                   "Type": "molWeight_Ar",
                   "Value": 0.039948,
                   "Unit": "kg/mol",
                   "Comment": "molecular weight argon"
               },
               {
                   "Type": "molWeight_Kr",
                   "Value": 0.0838,
                   "Unit": "kg/mol",
                   "Comment": "molecular weight krypton"
               },
               {
                   "Type": "molWeight_Xe",
                   "Value": 0.13129,
                   "Unit": "kg/mol",
                   "Comment": "molecular weight xenon"
               },
               {
                   "Type": "visc_He",
                   "Value": 0.0000088,
                   "Unit": "Pa s",
                   "Comment": "Wutz, 10.Auflage 2010, S.844,k.A. bei Kestin et al."
               },
               {
                   "Type": "visc_D2",
                   "Value": 0.00001231,
                   "Unit": "Pa s",
                   "Comment": "A. van Itterbeek, Miss A. Claes,Physica,Volume 5, Issue 10, December 1938, Pages 938-944"
               },
               {
                   "Type": "visc_N2",
                   "Value": 0.0000177,
                   "Unit": "Pa s",
                   "Comment": "viscosity nitrogen;Quelle: Kestin et al.,J. Phys. Chem Ref. Data, Vol. 13,No 1 1984"
               },
               {
                   "Type": "visc_CO",
                   "Value": 0.0000176,
                   "Unit": "Pa s",
                   "Comment": "Wutz, 10.Auflage 2010, S.844, bei Kestin et al stehen abs. identische Werte bei N2 und CO"
               },
               {
                   "Type": "visc_Ar",
                   "Value": 0.00002239,
                   "Unit": "Pa s",
                   "Comment": "viscosity argon;Quelle: Kestin et al.,J. Phys. Chem Ref. Data, Vol. 13,No 1 1984"
               },
               {
                   "Type": "virialCoeff_H2",
                   "Value": 14.7,
                   "Unit": "cm^3/mol",
                   "Comment": "Werte f. 296K;Wutz, 10.Auflage 2010, S.845"
               },
               {
                   "Type": "virialCoeff_D2",
                   "Value": 13.4,
                   "Unit": "cm^3/mol",
                   "Comment": "Werte f. 296K;Wutz, 10.Auflage 2010, S.845"
               },
               {
                   "Type": "virialCoeff_He",
                   "Value": 11.7,
                   "Unit": "cm^3/mol",
                   "Comment": "Werte f. 296K;Wutz, 10.Auflage 2010, S.845"
               },
               {
                   "Type": "virialCoeff_Ne",
                   "Value": 11.2,
                   "Unit": "cm^3/mol",
                   "Comment": "Werte f. 296K;Wutz, 10.Auflage 2010, S.845"
               },
               {
                   "Type": "virialCoeff_N2",
                   "Value": -5.1,
                   "Unit": "cm^3/mol",
                   "Comment": "Werte f. 296K;Wutz, 10.Auflage 2010, S.845"
               },
               {
                   "Type": "virialCoeff_CO",
                   "Value": -8.8,
                   "Unit": "cm^3/mol",
                   "Comment": "Werte f. 296K;Wutz, 10.Auflage 2010, S.845"
               },
               {
                   "Type": "virialCoeff_Ar",
                   "Value": -16.5,
                   "Unit": "cm^3/mol",
                   "Comment": "Werte f. 296K;Wutz, 10.Auflage 2010, S.845"
               },
               {
                   "Type": "virialCoeff_H2O",
                   "Value": -1200,
                   "Unit": "cm^3/mol",
                   "Comment": "Werte f. 296K;Wutz, 10.Auflage 2010, S.845"
               },
               {
                   "Type": "virialCoeff_CO2",
                   "Value": -126.5,
                   "Unit": "cm^3/mol",
                   "Comment": "Werte f. 296K;Wutz, 10.Auflage 2010, S.845"
               },
               {
                   "Type": "virialCoeff_O2",
                   "Value": -16.9,
                   "Unit": "cm^3/mol",
                   "Comment": "Werte f. 296K;Wutz, 10.Auflage 2010, S.845"
               },
               {
                   "Type": "virialCoeff_Kr",
                   "Value": -52.7,
                   "Unit": "cm^3/mol",
                   "Comment": "Werte f. 296K;Wutz, 10.Auflage 2010, S.845"
               },
               {
                   "Type": "virialCoeff_Xe",
                   "Value": -136.5,
                   "Unit": "cm^3/mol",
                   "Comment": "Werte f. 296K;Wutz, 10.Auflage 2010, S.845"
               },
               {
                   "Type": "R",
                   "Value": 8.3145,
                   "Unit": "Pa m^3/mol/K",
                   "Comment": "molare Gaskonstante"
               },
               {
                   "Type": "Kb",
                   "Value": 1.380655e-23,
                   "Unit": "J/K",
                   "Comment": "K-Boltzmann, PTB-News 2/2011; rel. Uns. 8*10^(-6)"
               },
               {
                   "Type": "u",
                   "Value": 1.6605e-27,
                   "Unit": "kg",
                   "Comment": "atomic mass unit"
               },
               {
                   "Type": "g",
                   "Value": 9.812695,
                   "Unit": "m/s^2",
                   "Comment": "Mittelwert der beiden TU-Werte der Schwerebeschleunigung"
               }
           ],
           "Uncertainty": [
               {
                   "Type": "u_g",
                   "Value": 2.1e-7,
                   "Unit": 1,
                   "Comment": "relative Unsicherheit der beiden TU-Werte der Schwerebeschleunigung; berechnet aus: (Differenz der beiden Werte)/12^0.5 + quadr. addierte Unsicherheiten der beiden Werte"
               },
               {
                   "Type": "u_Kb",
                   "Value": 0.000004,
                   "Unit": 1,
                   "Comment": "1/2 der Angabe aus den PTB-Mitteilungen 2/2011"
               }
           ],
           "Conversion": [
               {
                   "Type": "C_2_K",
                   "Value": 273.15,
                   "Unit": "",
                   "Comment": "conversion C to K"
               },
               {
                   "Type": "sccm_2_mbarl/s",
                   "Value": 0.0169,
                   "Unit": "mbarl/s/sscm",
                   "Comment": "http://www.vacuumtechnology.com/PRODUCTS/LEAKS/LEAK_Files/LeakUnitConversion.shtml"
               },
               {
                   "Type": "m^3/s_2_l/s",
                   "Value": 1000,
                   "Unit": "l/m^3",
                   "Comment": "conversion from m^3/s to l/s"
               },
               {
                   "Type": "01T_V_2_mbar",
                   "Value": 0.0133322368,
                   "Unit": "mbar/Pa",
                   "Comment": "conversion 10Torr, Volt to mbar"
               },
               {
                   "Type": "1000T_V_2_mbar",
                   "Value": 133.322368,
                   "Unit": "mbar/Pa",
                   "Comment": "conversion 10Torr, Volt to mbar"
               },
               {
                   "Type": "Pa_2_mbar",
                   "Value": 0.01,
                   "Unit": "mbar/Pa",
                   "Comment": "conversion Pa to mbar"
               },
               {
                   "Type": "kPa_2_mbar",
                   "Value": 10,
                   "Unit": "mbar/kPa",
                   "Comment": "conversion kPa to mbar"
               },
               {
                   "Type": "kPa_2_Pa",
                   "Value": 1000,
                   "Unit": "Pa/kPa",
                   "Comment": "conversion kPa to Pa"
               },
               {
                   "Type": "mbar_2_Pa",
                   "Value": 100,
                   "Unit": "Pa/mbar",
                   "Comment": "conversion mbar to Pa"
               },
               {
                   "Type": "Torr_2_mbar",
                   "Value": 1.33322368,
                   "Unit": "mbar/Torr",
                   "Comment": "conversion Torr to mbar"
               },
               {
                   "Type": "mbarl/s_2_Pam^3/s",
                   "Value": 0.1,
                   "Unit": "Pam^3/mbarl",
                   "Comment": "conversion mbar l/s to Pa m^3/s"
               },
               {
                   "Type": "Pam^3/mol/K_2_mbarl/mol/K",
                   "Value": 10,
                   "Unit": "Pam^3/mbarl",
                   "Comment": "conversion Pa m^3/mol/K to mbar l/mol/K "
               },
               {
                   "Type": "l_2_cm^3",
                   "Value": 1000,
                   "Unit": "cm^3/l",
                   "Comment": "conversion l to cm^3"
               },
               {
                   "Type": "m^3_2_l",
                   "Value": 1000,
                   "Unit": "m^3/l",
                   "Comment": "conversion m^3 to l (bzw. dm^3)"
               },
               {
                   "Type": "mm^3_2_l",
                   "Value": 0.000001,
                   "Unit": "l/mm^3",
                   "Comment": "conversion mm^3 to l"
               },
               {
                   "Type": "ml_2_cm^3",
                   "Value": 1,
                   "Unit": "1",
                   "Comment": "ml = cm^3"
               },
               {
                   "Type": "mm_2_m",
                   "Value": 0.001,
                   "Unit": "1",
                   "Comment": "1m = 1000mm"
               },
               {
                   "Type": "m_2_mm",
                   "Value": 1000,
                   "Unit": "1",
                   "Comment": "1m = 1000mm"
               },
               {
                   "Type": "ms_2_s",
                   "Value": 0.001,
                   "Unit": "1",
                   "Comment": "1ms = 1e-3s"
               },
               {
                   "Type": "mA_2_A",
                   "Value": 0.001,
                   "Unit": "1",
                   "Comment": "1mA = 1e-3A"
               },
               {
                   "Type": "A_2_mA",
                   "Value": 1000,
                   "Unit": "1",
                   "Comment": "1A = 1000mA"
               }
           ]
       }
   }
}