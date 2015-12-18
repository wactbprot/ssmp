var _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , conf     = require("./conf")
  , logStrm  = require("bunyan-couchdb-stream")
  , utils    = require("./utils")
  , ok       = {ok:true}, err
  , log = bunyan.createLogger({name: conf.app.name + ".load.loadTask",
                               streams: utils.log_streams
                              });
/**
 * Description
 * @method expand_task
 * @param {Object} defStep
 * @param {Object} calibobjs
 */
module.exports = function (defStep, calibobjs){
  var nArr  = []
    , ids   = _.keys(calibobjs)
    , atn   = defStep.TaskName
    , dex
    , eCase
    , Nres

  defStep.Id = ids;

  if(defStep.ExpandSeq){
    dex  = clone(defStep.ExpandSeq)
    delete defStep.ExpandSeq;
    eCase = "as_seq"
  }

  if(defStep.ExpandPar){
    dex  = clone(defStep.ExpandPar)
    delete defStep.ExpandPar;
    eCase = "as_par"
    Nres = atn.length;
  }
  if(defStep.ExpandByName){
    dex   = clone(defStep.ExpandByName)
    delete defStep.ExpandByName;
    eCase = "by_name"
  }

  if(eCase){
    var ks   = _.keys(dex) // z.B. Values oder @exchpath
      , Nks  = ks.length // anz keys bzw der Ersetzungen

    Nres = dex[ks[0]].length;

    for(var v = 0; v < Nres; v++){
      for(var k = 0; k < Nks; k++){
        var key = ks[k]
          , goReplace = key.match(/^@[a-z]*/) ? true : false
          , expElem   = dex[key];

        if(eCase == "as_seq" || eCase == "by_name"){
          if(_.isEmpty(nArr[v])){
            nArr[v] = [clone(defStep)]
          }
          if(goReplace){
            nArr[v][0].Replace = nArr[v][0].Replace || {};
            nArr[v][0].Replace[key] = expElem[v];
          }else{// values go to Replace
            nArr[v][0].Use = nArr[v][0].Use || {};
            nArr[v][0].Use[key] = expElem[v];
          }// values go to Use

          if(_.isArray(atn)){
            nArr[v][0].TaskName =  atn[v];
          }else{
            nArr[v][0].TaskName =  atn;
          }
        }

        if(eCase == "as_par"){
          if(_.isEmpty(nArr[0])){
            nArr[0] = []
          }
          if(_.isEmpty(nArr[0][v])){
            nArr[0][v] = clone(defStep)
          }
          if(goReplace){
            nArr[0][v].Replace = nArr[0][v].Replace || {};
            nArr[0][v].Replace[key] = expElem[v];
          }else{// values go to Replace
            nArr[0][v].Use = nArr[0][v].Use || {};
            nArr[0][v].Use[key] = expElem[v];
          }// values go to Use

          if(_.isArray(atn)){
            nArr[0][v].TaskName =  atn[v];
          }else{
            nArr[0][v].TaskName =  atn;
          }
        }

      } // for k
    } // for v

    if(eCase == "by_name"){
      var nnArr =[]
        , aatn = _.isArray(atn) ? atn: [atn];
      for(var i = 0; i < nArr.length; i++){
        for(var j = 0; j < aatn.length; j++){
          var nStep = clone(nArr[i][0])
          nStep.TaskName =  aatn[j];
          nnArr.push([nStep])
        }
      }
      nArr = nnArr;
    }
    return nArr;
  }else{
    return [[defStep]]
  }
}
