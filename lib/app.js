/**
 * Eingang:
 * "Lass alle Hoffnung fahren"
 * -- Dante
 */
(function() {
     var name   = "ssmp",
     pa         = process.argv,
     port       = pa[2] | 8000,
     restify    = require("restify"),
     api        = require("./api"),
     _          = require("underscore"),
     bunyan     = require('bunyan'),
     log        = bunyan.createLogger({name:name}),
     server     = restify.createServer({name:name,
                                     log : log});

     server.use(restify.queryParser());
     server.use(restify.bodyParser());

     server.get( '/', api.status);

     // mpdoc --> id!!
     server.get('/mp/:id',   api.getmd);
     server.post('/mp/:doc', api.setmd);
     server.put('/mp/:doc',  api.setmd);

     server.get('/mp/:id/:substruct', api.getsubstruct);
    
    server.get( '/param/:group', api.getparam);
    server.post('/param/:group', api.setparam);

     server.listen(port, function() {
                       log.info({ok: true}, "server runs on port: " + port);
                   });

 }).call(this);