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
 * @param {Object} mps globales MP Objekt
 * @param {Object} req request-Objekt
 */
var get_mps = function(mps, req, cb){
  var ro = {}
    , ids = _.keys(mps);

  for(var i = 0; i < ids.length; i++ ){

    var id = ids[i]
      , cmp = mps[id];
    cmp.meta.get([], function(meta){
      ro[id]             = {};
      ro[id].Name        = meta.name;
      ro[id].Standard    = meta.standard;
      ro[id].Description = meta.description;

      cmp.exchange.get(["run_time"], function(u){
        ro[id].Uptime      = u;
        if(i ==  ids.length -1){
          cb(ro)
        }
      });
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
  var msg
    , doc = {}
    , id  = req.params.id
    , mp  = mps[id];

  doc.Mp             = {};
  doc.Mp.Container   = [];

  if(id && mps[id]){
    mp.meta.get([], function(meta){
      doc._id            = meta.id
      doc._rev           = meta.rev
      doc.Mp.Name        = meta.name;
      doc.Mp.Description = meta.description;
      doc.Mp.Standard    = meta.standard;
      doc.Mp.Date        = meta.date;
      mp.exchange.get([], function(e){
        doc.Mp.Exchange    = e
        mp.definitions.get([], function(d){
          doc.Mp.Definitions     = d
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
                              doc.Mp.Container.push(cc);
                              if(i == Nc -1){
                                cb(doc);
                              }
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
        }); // definitions
      }); // exch
    }); // meta
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
