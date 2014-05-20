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
all.statstr = {
  ini   : "unchecked",
  work  : "working",
  exec  : "executed",
  ready : "ready",
  missing: "missing"
};
exports.all = all;