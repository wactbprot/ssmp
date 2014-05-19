var all = {};
all.appname =  "ssmp";
all.database = {
  server    : "localhost",
  port      : "5984",
  name      : "mp_db",
  design    : "dbmp",
  tasksview : "tasks"
};
all.system = {
  heartbeat:1000
};
all.ctrlstr = {
  inistr   : "unchecked",
  workstr  : "working",
  readystr : "ready"
};
exports.all = all;