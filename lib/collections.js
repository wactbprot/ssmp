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
var get_frame = function(mps, req, cb){
  var msg,
      ro   = {},
      id   = req.params.id,
      mp   = mps[id];

  if(id && mps[id]){
    ro.Id          = id;
    ro.Standard    = mp.standard;
    mp.name.get([], function(n){
      ro.Name = n;
      mp.title.get([], function(t){
        ro.Title = t;
        mp.description.get([], function(d){
          ro.Description = d;
          cb(ro);
        });
      });
    });
  }else{
    cb({error:"no mp with |id|: |" + id + "| initialized"});
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
var get_mps = function(mps, req, cb){
  var ro = {}
    , ids = _.keys(mps);

  for(var i = 0; i < ids.length; i++ ){

    var id = ids[i]
      , cmp = mps[id];

    ro[id]             = {};
    ro[id].Name        = cmp.name      || "__name__";
    ro[id].Standard    = cmp.standard  || "__standard__";
    ro[id].Description = cmp.description

    cmp.exchange.get(["run_time"], function(u){
      ro[id].Uptime      = u;
      if(i ==  ids.length -1){
        cb(ro)
      }
    });
  }
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
var get_mp = function(mps, req, cb){
  var msg,
      doc  = {},
      id   = req.params.id,
      mp   = mps[id];

  if(id && mps[id]){
    doc._id            = mp._id
    doc._rev           = mp._rev
    doc.Mp             = {};
    doc.Mp.Container   = [];
    doc.Mp.Name        = mp.name;
    doc.Mp.Description = mp.description;
    doc.Mp.Standard    = mp.standard;
    doc.Mp.Date        = mp.date;
    doc.Mp.Date.push({Type: "cloned",
                      Value: utils.vlDate()});
    mp.exchange.get([], function(e){
      doc.Mp.Exchange    = e
      mp.recipes.get([], function(r){
        doc.Mp.Recipes     = r
        mp.tasks.get([], function(t){
          doc.Mp.Tasks       = t
          mp.ctrl.get([], function(c){
            var Nc = c.length;
            for(var i = 0; i < Nc; i++){
              var cc = {};
              mp.element.get([i], function(ei){
                cc.Element = ei;
                mp.recipe.get([i], function(ri){
                  cc.Recipe = ri;
                  mp.definition.get([i], function(di){
                    cc.Definition  = di;
                    mp.state.get([i], function(si){
                      cc.State = si;
                      mp.title.get([i], function(ti){
                        cc.Title = ti;
                        mp.ctrl.get([i], function(ci){
                          cc.Ctrl = ci;
                          mp.contdescr.get([i], function(pi){
                            cc.Description = pi;
                            mp.onerror.get([i], function(oi){
                              cc.OnError = oi;
                              doc.Mp.Container.push(cc);
                              if(i == Nc -1){
                                cb(doc);
                              }
                            }); // err
                          }); // ctrl
                        }); // cont. descr.
                      }); // title
                    }); // state
                  }); // def
                }); // recipe
              }); // elem
            } // for
          }); // ctr
        }); // task
      }); // recipes
    }); // exch
  }else{
    cb({error:"no mp with |id|: |" + id + "| initialized"});
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
      df, taskname, action, comment, value, key, st;
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
            key      = rr.Key   || "-",
            value    = rr.Value || "-",
            st       = state[seq][par];

          }else{
            df       = definition[seq][par],
            taskname = df.TaskName,
            action   = "unloaded",
            comment  = "unloaded",
            key      = "unloaded",
            value    = "unloaded",
            st       = "unloaded";
          }

          ro.taskstate[seq].step.push({
            TaskName: taskname,
            Action: action,
            Comment: comment,
            Key: key,
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