/**
 * conf *can not* be changed during runtime
 *
 */
var all = {};
all.app ={
  name :  'ssmp'
}
all.mem = {
  port: 9000
}

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

all.logdb = {
  server : 'localhost',
  port: 5984,
  prefix : 'ssmp_log'
}


module.exports = all;
