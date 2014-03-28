(function() {
     var pa     = process.argv,
     port       = pa[2] | 8000,
     nano       = require("nano"),
     http       = require("http"),
     restify    = require("restify"),
     disp       = require("./dispatch"),
     //     log        = restify.bunyan.createLogger("ssmplog"),
     _          = require("underscore");
     var bunyan = require('bunyan');
     var log = bunyan.createLogger({name: "myapp"});
     

     
     var server = restify.createServer({name: 'ssmp',
					log : log
				       });
     server.use(restify.queryParser());

     server.get('/status', disp.status);
     
     server.listen(port, function() {
		       console.log('%s listening at %s', server.name, server.url);
		   });
     
     

 }).call(this);