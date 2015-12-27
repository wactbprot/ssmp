/**
 * defaults can be changed during runtime
 *
 */
var all = {};
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
  port: 8004,
  intervall:100,
  timeout:200
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
  name            : 'vl_db',
  design          : 'dbmp',
  tasksview       : 'tasks',
  taskslist       : 'gettask',
  containerview   : 'container',
  containerlist   : 'getcontainer',
  docinfoshow     : 'docinfo'
};

module.exports = all;
