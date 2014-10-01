
var all = {};
all.appname =  'ssmp';
/**
 * data base defaults
 */
all.database = {
  server      : 'localhost',
  port        : 5984,
  name        : 'mp_db',
  design      : 'dbmp',
  tasksview   : 'tasks',
  taskslist   : 'get',
  docinfoshow : 'docinfo'
};

/**
 * node relay defaults
 */
all.relay = {
  server    : 'localhost',
  port      : 55555
};

/**
 * system defaults
 */
all.system = {
  heartbeat: 300,
  pardelaymult: 10, // Multiplikator
  againdelay:100
};
/**
 * container defaults
 */
all.container = {
  heartbeat:300
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
  run     : 'run',
  pause   : 'pause',
  stop    : 'stop',
  error   : 'error',
  work    : 'working',
  mon     : 'mon'
};
all.fallbackvalues = {
  text:'',
  tooltip:'',
  number: null,
  bool: false
};
all.cucoStr = 'CUCO';
all.cucoRE = /^CUCO\-/;
module.exports = all;
