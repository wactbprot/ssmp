var    _   = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , deflt    = require("./default")
  , log      = bunyan.createLogger({name: deflt.app.name + ".load.expandCust"})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
  , err

/**
 * Expandiert über customer
 * @method expand_cust
 * @param {Object} defStep
 * @param {Object} calibobjs
 * @return ArrayExpression
 */
module.exports = function (defStep, calibobjs){
  var nParArr  = []
    , cdIds    = _.keys(calibobjs)
    , NcdIds   = cdIds.length
    , taskname = defStep.TaskName || deflt.misc.missingTaskName;

  if(cdIds.length > 0){
    for(var i = 0; i < NcdIds; i++){
      var calibId    = cdIds[i]
        , calibObj   = calibobjs[calibId]
        , deviceName = deflt.misc.custDevPrefix + "_" + i
        , cps        = clone(defStep);

      if(calibObj.Device && _.isString(calibObj.Device)){
        deviceName  = calibObj.Device.replace(/\s/g, "_");
      }
      cps.Id         = [calibId];
      cps.DeviceName = deviceName;
      cps.TaskName   = deviceName + "-" + taskname;

      nParArr.push(cps);
    }
  }else{
    var cps = clone(defStep);
    cps.Id  = [];
    cps.DeviceName = deflt.misc.custDevPrefix;
    cps.TaskName   = deflt.misc.custDevPrefix + "-" + taskname;

    nParArr.push(cps);
  }
  return [nParArr];
}
