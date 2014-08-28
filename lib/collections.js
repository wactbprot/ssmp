var gen      = require("./generic"),
    utils    = require("./utils");;

var get_frame = function(mps, req){
  var msg,
      ro   = {},
      id   = req.params.id,
      mp   = mps[id];

  ro.Title       = mp.title.get([]);
  ro.Name        = mp.name.get([]);
  ro.Description = mp.description.get([]);
  ro.Standard    = mp.standard;
  ro.Id          = id;

  return ro;
};
exports.get_frame = get_frame;


var get_mps = function(mps, req){
  var ro = {};
  for(var i in mps){
    var cmp = mps[i]
    ro[i] = { "Name": cmp.name.get([]) || "__name__",
              "Standard": cmp.standard     || "__standard__",
              "Description": cmp.description.get([]) || "__description__",
              "Uptime":cmp.exchange.get(["run_time"])
            }
  }
  return ro;
};
exports.get_mps = get_mps;

var get_mp = function(mps, req){
  var msg,
      doc  = {},
      id   = req.params.id,
      mp   = mps[id];
  if(id && mps[id]){
    doc._id            = mp._id
    doc._rev           = mp._rev
    doc.Mp             = {};
    doc.Mp.Container   = [];

    doc.Mp.Name        = mp.name.get([]);
    doc.Mp.Description = mp.description.get([]);
    doc.Mp.Standard    = mp.standard;
    doc.Mp.Date        = mp.date;
    doc.Mp.Date.push({Type: "cloned",
                      Value: utils.vlDate()});

    doc.Mp.Exchange    = mp.exchange.get([]);
    doc.Mp.Recipes     = mp.recipes.get([]);
    doc.Mp.Tasks       = mp.tasks.get([]);

    for(var i = 0; i < mp.ctrl.get([]).length; i++){

      var cc = {};
      cc.Element     = mp.element.get([i]);
      cc.Recipe      = mp.recipe.get([i]);
      cc.Definition  = mp.definition.get([i]);
      cc.State       = mp.state.get([i]);
      cc.Title       = mp.title.get([i]);
      cc.Ctrl        = mp.ctrl.get([i]);
      cc.OnError     = mp.onerror.get([i]);

      doc.Mp.Container.push(cc);
  }
    return doc;
  }else{
    return {error:"no mp with |id|: |" + id + "| initialized"};
  }
};
exports.get_mp = get_mp;
