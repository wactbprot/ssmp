var all = {};
all.app ={
  name :  'ssmp'
}
all.mem   ={
  port: 9000
};

/**
 * http-api defaults
 */
all.http = {
  port  : 8001
};

/**
 * info
 */
all.info={
  port: 8003
};

all.io   ={
  port: 8004
};

/**
 * node relay defaults
 */
all.relay = {
  server    : 'localhost',
  port      : 55555
};

/**
 * ndata (mem) defaults
 */

/**
 * system defaults
 */
all.system = {
  heartbeat: 200,
  par_delay_mult: 50 // Multiplikator
};

/**
 * container defaults
 */
all.container = {
  heartbeat:200
};

all.misc={
  custDevPrefix : "CustomerDevice",
  missingTaskName : "MissingTaskName"
}



/**
 * data base defaults
 */
all.database = {
  server          : 'localhost',
  port            : 5984,
  name            : 'vl_db',
  design          : 'dbmp',
  tasksview       : 'tasks',
  taskslist       : 'gettask',
  containerview   : 'container',
  containerlist   : 'getcontainer',
  docinfoshow     : 'docinfo'
};

/**
 * static strings used
 * everywhere
 */
all.ctrlStr = {
  ini     : 'ini',
  exec    : 'executed',
  ready   : 'ready',
  load    : 'load',
  rm      : 'remove',
  run     : 'run',
  pause   : 'pause',
  stop    : 'stop',
  error   : 'error',
  work    : 'working',
  mon     : 'mon'
};

/**
 * defaults for fallback values
 */
all.fallbackvalues = {
  text:'',
  tooltip:'',
  number: null,
  bool: false
};

module.exports = all;
