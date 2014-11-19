var _        = require("underscore")
  , ndata    = require("ndata")
  , bunyan  = require("bunyan")
  , deflt    = require("./default")
  , log      = bunyan.createLogger({name: deflt.appname})
  , ctrlstr  = deflt.ctrlStr;

var mem = ndata.createClient({port: 9000});

/**
 * Die Funktion```get_mps()``` stellt
 * Informationen über die initialisierten
 * Messprogramme zusammen.
 *
 * @param {Object} req request-Objekt
 */
var get_mps = function(req, cb){
  var ro = {};

  mem.getAll(function(err, all){

    var idA = _.keys(all);
    for(var i = 0; i < idA.length; i++ ){
      var id = idA[i];
      var meta = all[id].meta;

      ro[id]             = {};
      ro[id].Name        = meta.name;
      ro[id].Standard    = meta.standard;
      ro[id].Description = meta.description;

      mem.get([id, "exchange", "run_time"], function(last, ro, id){
                                              return function(err, val){
                                                ro[id].Uptime      = val;
                                                if(last){
                                                  cb(ro)
                                                }
                                              }}(i == idA.length - 1, ro, id));

    }
  });
};
exports.get_mps = get_mps;

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
var get_task_state = function(mps, req, cb){
  var ro   = {taskstate:[]}
    , id   = req.params.id
    , no   = req.params.container
    , mp   = mps[id]
    , df, taskname, action, comment, value, key, st;

  if(id && mps[id]){
    if(_.isUndefined(no)){
      cb({error:"no container requested"});
    }else{

      mp.state.get([no], function(state){
        mp.definition.get([no], function(definition){
          mp.recipe.get([no], function(recipe){

            var Nstate = state.length
            for(var seq = 0; seq < Nstate; seq++){

              ro.taskstate.push({step:[]});

              for(var par = 0; par < state[seq].length; par++){

                if(recipe && recipe[seq] && recipe[seq][par]){
                  var rr   = recipe[seq][par];
                  taskname = rr.TaskName;
                  action   = rr.Action;
                  comment  = rr.Comment;
                  key      = rr.Key   || "-",
                  value    = rr.Value || "-",
                  st       = state[seq][par];

                }else{
                  taskname = "unloaded";
                  action   = "unloaded";
                  comment  = "unloaded";
                  key      = "unloaded";
                  value    = "unloaded";
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
            if(seq == Nstate){
              cb(ro);
            }
          });
        });
      });
    }
  }else{
    cb({error:"no mp with |id|: |" + id + "| initialized"});
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
var get_container_elements = function(mps, req, cb){
  var ro   = {}
    , id   = req.params.id
    , no   = req.params.container
    , key  = req.params.key
    , mp   = mps[id];


  if(id && mps[id]){
    if(_.isUndefined(no)){
      cb( {error:"no container requested"});
    }else{
      if(key){
        mp.exchange.get([key], function(val){
          val.key = key;
          val.id  = id;
          val.no  = no;
          ro[key] = val;
          cb(ro);
        });
      }else{
        mp.exchange.get([], function(exchObj){
          mp.element.get([no], function(elem){
            var exchKeys = _.keys(exchObj)
              , Nelem    = elem.length;

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
                    var elkey = elemkey[k]
                      , val   = exchObj[elkey];
                    val.key = elkey;
                    val.id    = id;
                    val.no    = no;
                    ro[elkey] = val;
                  }
                }
              } // for
              cb(ro);
            }else{
              cb({error:"exchange seems to have length 0"});
            }
          }); // elem
        }); // exchob
      }
    }
  }else{
    cb({error:"no mp with |id|: |" + id + "| initialized"});
  }
}
exports.get_container_elements = get_container_elements;
