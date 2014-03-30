(function() {
    var name   = "ssmp", 
    pa         = process.argv,
    port       = pa[2] | 8000,
    restify    = require("restify"),
    api        = require("./api"),
    _          = require("underscore"),
    bunyan     = require('bunyan'),
    log        = bunyan.createLogger({name:name});
    server     = restify.createServer({name:name,
				       log : log});
    server.use(restify.queryParser());
    
    server.get('/', api.status);
    server.get('/:mpdoc', api.getmpdoc);
    
    server.listen(port, function() {
	log.info({ok: true}, "server runs on port: " + port);    
		   });
    
}).call(this);