var net  = require("net")
  , conf = require("../../lib/conf")

var client = new net.Socket();
client.connect(conf.log.port, conf.log.server, function() {
});

client.on("data", function(data) {
                process.stdout.write(data.toString("utf8"));
});

client.on("close", function() {
	console.log('Connection closed');
});