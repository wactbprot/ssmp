/**
 * conf *can not* be changed during runtime
 *
 */
var all = {};

all.date = new Date();

all.app ={
  name :  'ssmp'
}
all.mem = {
  port: 9000
}

all.http = {
  port  : 8001
};

/**
 * node relay defaults
 */
all.relay = {
    // server    : 'i75434.berlin.ptb.de',
    server    : 'localhost',
    port      : 55555
};

/**
 * system defaults
 */
all.system = {
  heartbeat: 300,
  par_delay_mult: 80, // Multiplikator
  db_delay_mult: 80 // Multiplikator
};

/**
 * container defaults
 */
all.container = {
  heartbeat:300
};

/**
 * data base defaults
 */
all.database = {
  server          : 'localhost',
  port            : 5984,
  name            : 'vl_db_work',
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

all.misc={
  custDevPrefix : "CustomerDevice",
  missingTaskName : "MissingTaskName"
}

all.dumpdb = {
  server : 'localhost',
  port: 5984,
  name : 'ssmp_dump'
}

/**
 * Log stream array
 * @method log_streams
 * @return log stream array
 */
all.log = {};
all.log.streams = [{
  level: 'trace',
  stream: process.stdout
}];

/**
 * info
 */
all.info={
  port: 8003
};
all.io   ={
  port: 8004,
  intervall:100,
  timeout:200
};

module.exports = all;
