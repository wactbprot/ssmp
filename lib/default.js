var all = {};
all.appname =  'ssmp';

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
 * node relay defaults
 */
all.relay = {
  server    : 'localhost',
  port      : 55555
};

/**
 * ndata (mem) defaults
 */
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
 * socketio-api defaults
 */
all.socket={
  port: 8002
};

/**
 * system defaults
 */
all.system = {
  heartbeat: 100,
  par_delay_mult: 50 // Multiplikator
};

/**
 * container defaults
 */
all.container = {
  heartbeat:100
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

all.custDevPrefix   = "CustomerDevice";
all.MissingTaskName = "MissingTaskName";
module.exports = all;
