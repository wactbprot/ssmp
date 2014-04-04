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

  server.pre(restify.pre.sanitizePath());
  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  server.get( '/', api.status);

  // mpdoc --> id!!
  server.get('/mp/:id',         api.getmd);
  server.get('/mp/:id/:l1',     api.getmd);
  server.get('/mp/:id/:l1/:l2', api.getmd);

  server.post('/mp/:doc',       api.setmd);
  server.put('/mp/:doc',        api.setmd);


  server.get( '/param/:group', api.getparam);
  server.post('/param/:group', api.setparam);

  server.listen(port, function() {
    log.info({ok: true}, "server runs on port: " + port);
  });

}).call(this);