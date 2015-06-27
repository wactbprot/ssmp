var name     = "info"
  , hc       = require("./template")
  , bunyan   = require("bunyan")
  , utils    = require("../lib/utils")
  , log      = bunyan.createLogger({name: name});

module.exports  = function(cb){
  log.info({ok:true}
          , "try generating defaults template");
  var pack = utils.get_jsn("./")

  cb(hc["index"](pack));
}

//
//{ package:
//   { author: 'wactbprot',
//     name: 'ssmp',
//     description: 'server side measurment program',
//     version: '0.4.0',
//     repository: { type: 'git', url: 'https://github.com/wactbprot/ssmp' },
//     dependencies:
//      { underscore: '>=1.8.3',
//        clone: '>=1.0.2',
//        restify: '>=3.0.3',
//        commander: '>=2.8.1',
//        bunyan: '>=1.3.5',
//        'object-path': '>=0.9.2',
//        'socket.io': '>=1.3.5',
//        ndata: '>=2.8.3',
//        handlebars: '>=1.3.0' },
//     scripts:
//      { mpshell: 'bin/mpsh',
//        doc: 'dox-foundation --source ./ --target doc/ --ignore coverage,test,node_modules -t ssmp',
//        mem: 'bin/mem | bunyan -l info -o short',
//        ssmp: 'bin/ssmp | bunyan -l info -o short',
//        'show-cover': 'firefox  coverage/lcov-report/index.html',
//        test: 'istanbul cover _mocha -- -R spec | bunyan -l fatal',
//        'all-dev': 'npm test && npm run doc' },
//     devDependencies:
//      { mocha: '>=2.2.5',
//        istanbul: '>=0.3.14',
//        'dox-foundation': '>=0.5.6',
//        prettyjson: '>=1.1.2' },
//     optionalDependencies: {},
//     engines: { node: '*' } } }
//
