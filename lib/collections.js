var gen      = require("./generic"),
    utils    = require("./utils");
/**
 * Die Funktion ```get_frame()```
 * stellt
 * * die MP _id_
 * * das MP _standard_
 * * den _name_
 * * den _container title_ und
 * * die _container description_
 * in einem Objekt zusammen.
 *
 * @param {Object} mps globales MP Objekt
 * @param {Object} req request-Objekt
 */
var get_frame = function(mps, req){
  var msg,
      ro   = {},
      id   = req.params.id,
      mp   = mps[id];

  if(id && mps[id]){
    ro.Id          = id;
    ro.Standard    = mp.standard;
    ro.Name        = mp.name.get([]);

    ro.Title       = mp.title.get([]);
    ro.Description = mp.description.get([]);

    return ro;
  }else{
    return {error:"no mp with |id|: |" + id + "| initialized"};
  }
};
exports.get_frame = get_frame;

/**
 * Die Funktion```get_mps()``` stellt
 * Informationen über die initialisierten
 * Messprogramme zusammen.
 *
 * @param {Object} mps globales MP Objekt
 * @param {Object} req request-Objekt
 */
var get_mps = function(mps, req){
  var ro = {};
  for(var i in mps){
    var cmp = mps[i]
    ro[i] = { "Name"       : cmp.name.get([])        || "__name__",
              "Standard"   : cmp.standard            || "__standard__",
              "Description": cmp.description.get([]) || "__description__",
              "Uptime"     : cmp.exchange.get(["run_time"])
            }
  }
  return ro;
};
exports.get_mps = get_mps;


/**
 * Die Funktion```get_mp()``` erstellt
 * ein, der MP-Definition analoges Dokument
 * welches den aktuellen Zustand des MPs
 * abbildet.
 *
 * @param {Object} mps globales MP Objekt
 * @param {Object} req request-Objekt
 */
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

/**
 * Die Funktion```get_mp()``` erstellt
 * ein, der MP-Definition analoges Dokument
 * welches den aktuellen Zustand des MPs
 * abbildet.
 *
 * @param {Object} mps globales MP Objekt
 * @param {Object} req request-Objekt
 */
var get_taskstate = function(mps, req){
  var ro   = {},
      id   = req.params.id,
      no   = req.params.container,
      mp   = mps[id];
  if(id && mps[id]){
    var state   = mp.state.get([]),
        recipes = mp.recipes.get([]);

    for(var seq = 0; seq < state.length; seq++){
    }
  }else{
    return {error:"no mp with |id|: |" + id + "| initialized"};
  }
};
