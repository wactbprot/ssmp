var _        = require("underscore"),
    gen      = require("./generic"),
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
 * Die Funktion```get_task_state()``` erstellt
 * ein dem Endpunkt ```state/n``` analoges Dokument
 * welches den aktuellen Zustand des containers ```n```
 * abbildet und  Informantionen der zugeordneten
 * Tasks enthält.
 *
 * @param {Object} mps globales MP Objekt
 * @param {Object} req request-Objekt
 */
var get_task_state = function(mps, req){
  var ro   = {taskstate:[]},
      id   = req.params.id,
      no   = req.params.container,
      mp   = mps[id],
      df, taskname, action, comment, value,st;
  if(id && mps[id]){
    if(_.isUndefined(no)){
      return {error:"no container requested"};
    }else{
      var state      = mp.state.get([no]),
          definition = mp.definition.get([no]),
          recipe     = mp.recipe.get([no]),
          loaded     = recipe ? true : false;

      for(var seq = 0; seq < state.length; seq++){
        ro.taskstate.push({step:[]});

        for(var par = 0; par < state[seq].length; par++){
          if( loaded ){
            var rr      = recipe[seq][par];
            taskname = rr.TaskName,
            action   = rr.Action,
            comment  = rr.Comment,
            value    = _.isString(rr.value)?rr.Value:JSON.stringify(rr.Value,null,2),
            st       = state[seq][par];
          }else{
            df       = definition[seq][par],
            taskname = df.TaskName,
            action   = "unloaded",
            comment  = "unloaded",
            value    = "unloaded",
            st       = "unloaded";
          }

          ro.taskstate[seq].step.push({
            TaskName: taskname,
            Action: action,
            Comment: comment,
            Value:  value,
            State: st
          })
        }
      }
      return ro;
    }
  }else{
    return {error:"no mp with |id|: |" + id + "| initialized"};
  }
};
exports.get_task_state = get_task_state;


/**
 * Die Funktion```get_container_elements()``` bedient
 * den Endpunkt ```containerelements/n```. Es wird
 * ```element/n``` und ```exchange/``` vereinigt.
 *
 * @param {Object} mps globales MP Objekt
 * @param {Object} req request-Objekt
 */
var get_container_elements = function(mps, req){
  var ro   = {},
      id   = req.params.id,
      no   = req.params.container,
      key  = req.params.key,
      mp   = mps[id];


  if(id && mps[id]){
    if(_.isUndefined(no)){
      return {error:"no container requested"};
    }else{
      if(key){
        var val  = mp.exchange.get([key]);
        val.key = key;
        val.id  = id;
        val.no  = no;
        ro[key] = val;
      }else{
        var exchObj  = mp.exchange.get([]),
            exchKeys = _.keys(exchObj),
            elem     = mp.element.get([no]),
            Nelem    = elem.length;

        if(Nelem > 0){
          for(var i = 0; i < Nelem; i++){
            // keys können wildcard * enthalten
            var pat = new RegExp("^" + elem[i].replace(/\*/g, "[A-Za-z0-9\-_ ]*") + "$");
            // exchange wird nach passenden
            // keys durchsucht (gefiltert)
            var elemkey = _.filter(exchKeys, function(k){
                            return  k.search(pat) > -1;
                          });
            var noOfk   = elemkey.length;
            if(noOfk > 0){
              for(var k = 0; k < noOfk; k++){
                var elkey = elemkey[k],
                    val   = exchObj[elkey];

                val.key = elkey;
                val.id    = id;
                val.no    = no;
                ro[elkey] = val;
              }
            }
          }
        }
      }
      return ro;
    }
  }else{
    return {error:"no mp with |id|: |" + id + "| initialized"};
  }
}
exports.get_container_elements = get_container_elements;