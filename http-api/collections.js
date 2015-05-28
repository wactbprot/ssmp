var name     = "http-ssmp"
  ,  _       = require("underscore")
  , ndata    = require("ndata")
  , bunyan   = require("bunyan")
  , deflt    = require("../lib/default")
  , log      = bunyan.createLogger({name: name})
  , ctrlstr  = deflt.ctrlStr;

var mem = ndata.createClient({port: deflt.mem.port});

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
    if(!err){
      var idA = _.keys(all);
      if(idA.length > 0){
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
      }else{
        ro = {warn:"no mp available"}
        log.warn(ro
                , "nothing loaded, no mp available");
        cb(ro);
      }
    }else{
      ro = {error:err};
      log.error(ro
               , "error on attempt to mem.getAll");
      cb(ro)
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
 * @param {Object} req request-Objekt
 */
var get_task_state = function(req, cb){
  var ro   = {taskstate:[]}
    , id   = req.params.id
    , no   = req.params.container
    , df, taskname, action, comment, value, key, st, rr
    , path_b = [id]
    , path_r = path_b.concat(["exchange", "run_time","Value", "value"])

  if(_.isUndefined(no)){
    cb({error:"no container requested"});
  }else{

    mem.get(path_r, function(err, rtime){
      if(!err && rtime){
        var path_n = path_b.concat([no]);
        mem.get(path_n.concat(["state"]), function(err, state){
          if(!err){
            mem.get(path_n.concat(["recipe"]), function(err, recipe){
              if(!err){
                var sk = _.keys(state)
                var sN = sk.length
                for(var s = 0; s < sN; s++){
                  ro.taskstate.push({step:[]});

                  var skp = _.keys(state[sk[s]])
                    , skN = skp.length
                  for(var p = 0; p < skN; p++){

                    if(recipe && recipe[sk[s]] && recipe[sk[s]][skp[p]] &&
                       state  && state[sk[s]]  && state[sk[s]][skp[p]]){

                      rr   = recipe[sk[s]][skp[p]];
                      st   = state[sk[s]][skp[p]];

                      taskname = rr.TaskName;
                      action   = rr.Action;
                      comment  = rr.Comment;
                      key      = rr.Key   || "-";
                      value    = rr.Value || "-";

                    }else{
                      taskname = "unloaded";
                      action   = "unloaded";
                      comment  = "unloaded";
                      key      = "unloaded";
                      value    = "unloaded";
                      st       = "unloaded";
                    }
                    ro.taskstate[s].step.push({
                      TaskName: taskname,
                      Action: action,
                      Comment: comment,
                      Key: key,
                      Value:  value,
                      State: st
                    }); // push
                  } // for p
                } // for s
                if(s == sN){
                  cb(ro);
                }
              }else{
                cb({error:err}
                  , "can not get recipe of container: " + no);
              }
            }); // recipe
          }else{
            cb({error:err}
              , "can not get state of container: " + no);
          }
        }); // get state
      }else{
        cb({error:"no mp with |id|: |" + id + "| initialized"});
      }
    }); // rtime
  } // if no
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
var get_elements = function(req, cb){
  var ro   = {}
  if(req.params){
    var mpid = req.params.id
      , no   = req.params.container

    if(mpid && no){
      var fpat    = /\*/g
        , bpat    = "[A-Za-z0-9\-_ ]*"

      mem.get([mpid, no, "element"], function(err, elem){
        if(!err){
          mem.get([mpid, "exchange"], function(err, exch){
            if(!err){
              var exch_keys   = _.keys(exch)
                , no_of_elem   = elem.length;

              if(no_of_elem > 0){
                for(var i = 0; i < no_of_elem; i++){
                  // keys können wildcard * enthalten
                  var pat = new RegExp("^" + elem[i].replace(fpat, bpat) + "$");
                  // exchange wird nach passenden
                  // keys durchsucht (gefiltert)

                  var elem_key = _.filter(exch_keys, function(k){
                                   return  k.search(pat) > -1;
                                 });

                  var no_of_keys   = elem_key.length;
                  if(no_of_keys > 0){
                    for(var k = 0; k < no_of_keys; k++){
                      var ret_key = elem_key[k];
                      ro[ret_key] = exch[ret_key];
                    }
                  }
                } // for
                cb(ro);
              }else{
                cb({error:"exchange seems to have length 0"});
              }
            }else{
              cb({error:"can not read from exchange"});
            }
          }); //exchange
        }else{
          cb({error:"can not read from element"});
        }
      }); // element
    }else{
      cb({error:"wrong path"});
    }
  }else{
    cb({error:"wrong request"});
  }

}
exports.get_elements = get_elements;
