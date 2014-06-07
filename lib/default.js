
var all = {};
all.appname =  "ssmp";
/**
 * data base defaults
 */
all.database = {
  server      : "localhost",
  port        : 5984,
  name        : "mp_db",
  design      : "dbmp",
  tasksview   : "tasks",
  taskslist   : "get",
  docinfoshow : "docinfo"
};

/**
 * node relay defaults
 */
all.relay = {
  server    : "localhost",
  port      : 55555
};

/**
 * system defaults
 */
all.system = {
  heartbeat:500
};
/**
 * container defaults
 */
all.container = {
  heartbeat:500
};
/**
 * static strings used
 * everywhere
 */
all.statstr = {
  ini     : "unchecked",
  work    : "working",
  exec    : "executed",
  ready   : "ready",
  missing : "missing",
  load    : "loading",
  run     : "running",
  stop    : "stoping",
  error   : "error"
};
all.fallbackvalues = {
  text:"",
  tooltip:"",
  number: null,
  bool: false
};
all.cucoRE = /^CUCO\-/;
module.exports = all;