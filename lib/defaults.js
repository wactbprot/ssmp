var all = {};
all.database = {
  server:"localhost",
  port:"5984",
  name :"mp_db",
  design:"dbmp",
  tasksview:"tasks"
};
all.system = {
  heartbeat:1000
};
exports.all = all;