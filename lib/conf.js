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
    server: "localhost",
    port: 9000
  },
  http: {
    server: "localhost",
    port: 8001
  },
  frame : {
    server:"localhost",
    port: 8002,
    apppath: "extensions/frame/",
    appname: "frame"
  },
 chart :{
    port: 8003,
    server:"localhost",
    intervall:500,
    apppath: "extensions/chart/",
    appname: "chart"
  },
  relay : {
    server: "localhost",
    port: 55555
  },
  anselm : {
    server: "localhost",
    port: 50005
  },
  system : {
    heartbeat: 200,
    par_delay_mult: 100, // Multiplikator
    db_delay_mult: 200, // Multiplikator
    vxi11_buffer_time: 100
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
    mon     : "mon",
    yes     : "yes",
    no      : "no"
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
log : {server: "0.0.0.0",port: 8005,backoffStrategy: {name: "fibonacci",initialDelay: 300,maxDelay: 10000},retryNum: 10,streams : [{level: "trace",stream: process.stdout}]}}

all.log.streams.push({
        level: "trace",
        stream: bunyanTcp.createBunyanStream(all.log),
        type: "raw",
        closeOnExit: false
      });
module.exports = all;
