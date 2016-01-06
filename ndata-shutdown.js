(function(){
  var ndata    = require("ndata")
    , server   = ndata.createServer({port: 9000});

  server.on('ready', function(){
    var client  = ndata.createClient({port: 9000})

    client.subscribe("shutdown", function (err){
      console.log("subscribe")
    });

    client.on('message', function (ch, val){
      if(ch == "shutdown"){
        console.log("server shutdown");
        server.destroy();
      }
    });

    client.on('exit', function (l){
      console.log("client exit");
    });
  });
})();