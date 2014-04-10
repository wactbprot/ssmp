var _ = require("underscore");

exports.load  = function(mp, no){

  var state = mp.go.get([no]);
  if(state !== "running"){
    mp.go.set([no], "loading")
    var recipe = mp.recipe.get([no])
    if(_.isArray(recipe)){
      _.each(recipe,function(selem, sno){
        _.each(selem,function(taskn, pno){

          //console.log("selem " + JSON.stringify(selem))
          //console.log("sno "   + JSON.stringify(sno))
          //console.log("taskn " + JSON.stringify(taskn))
          //console.log("pno "   + JSON.stringify(pno))

        })
      })
    }
  }
};

exports.run  = function(mp, no){
};

exports.stop = function(mp, no){
};