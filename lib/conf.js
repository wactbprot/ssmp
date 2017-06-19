var bunyanTcp = require("bunyan-tcp2");
/**
 * conf *can not* be changed during runtime
 *
 */
var all = {
  date : new Date(),
  app : {
    name :  "ssmp"
  },
  mem : {
    server    : "localhost",
    port: 9000
  },
  http: {
    server    : "localhost",
    port  : 8001
  },
  frame : {
    server  :"localhost",
    port    : 8002,
    apppath : "extensions/frame/",
    appname :  "frame"
  },
  info :{
    server    : "localhost",
    port: 8003
  },
  io :{
    port: 8004,
    intervall:100,
    timeout:200
  },
  relay : {
    server    : "localhost",
    port      : 55555
  },
  system : {
    heartbeat: 300,
    par_delay_mult: 80, // Multiplikator
    db_delay_mult: 80 // Multiplikator
  },
  container : {
    heartbeat:300
  },
  database : {
    server          : "localhost",
    port            : 5984,
    name            : "vl_db_work",
    design          : "dbmp",
    tasksview       : "tasks",
    taskslist       : "gettask",
    containerview   : "container",
    containerlist   : "getcontainer",
    docinfoshow     : "docinfo"
  },
  ctrlStr : {
    ini     : "ini",
    exec    : "executed",
    ready   : "ready",
    load    : "load",
    rm      : "remove",
    run     : "run",
    pause   : "pause",
    stop    : "stop",
    error   : "error",
    work    : "working",
    mon     : "mon"
  },
  fallbackvalues : {
    text:"",
    tooltip:"",
    number: null,
    bool: false
  },
  misc:{
    custDevPrefix : "CustomerDevice",
    missingTaskName : "MissingTaskName"
  },
  dumpdb : {
    server : "localhost",
    port: 5984,
    name : "ssmp_dump"
  },
  log : {
    server: "0.0.0.0",
    port: 8005,
    backoffStrategy: {
      name: "fibonacci",
      initialDelay: 300,
      maxDelay: 10000
    },
    retryNum: 10,
    streams : [
      {
        level: "trace",
        stream: process.stdout
      }
    ]
  }
}
all.log.streams.push({
        level: "trace",
        stream: bunyanTcp.createBunyanStream(all.log),
        type: "raw",
        closeOnExit: true
      });
module.exports = all;
