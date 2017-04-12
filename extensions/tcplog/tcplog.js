var net     = require("net")
  , _       = require("underscore")
  , conf    = require("../../lib/conf")
  , clients = [];

module.exports = function(cb){
  net.createServer(function (socket) {
    socket.name = socket.remoteAddress + ":" + socket.remotePort
    clients.push(socket);

    socket.on('data', function (data) {
      broadcast(data, socket);
    });

    socket.on('end', function () {
      clients.splice(clients.indexOf(socket), 1);
    });

    function broadcast(message, sender) {
      clients.forEach(function (client) {
        if (client === sender) return;
        client.write(message);
      });
    }

  }).listen(conf.log.port, conf.log.server, 0, function(){

    console.log("----> log server on port: " + conf.log.port);
    if(_.isFunction(cb)){
      cb();
    }
  });
}