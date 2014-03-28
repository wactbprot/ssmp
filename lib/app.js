(function() {
     var name   = "ssmp", 
     pa         = process.argv,
     port       = pa[2] | 8000,
     restify    = require("restify"),
     disp       = require("./dispatch"),
     _          = require("underscore");
     var bunyan = require('bunyan');
     var log    = bunyan.createLogger({name:name});
     

     
     var server = restify.createServer({name:name,
					log : log});
     server.use(restify.queryParser());

     server.get('/', disp.status);
     
     server.listen(port, function() {
		       log.info({ok: true}, "server runs on port: " + port);    
		   });
     
 }).call(this);