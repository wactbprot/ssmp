var  connected_html   = "<h2 id='con_state'"
                      + " class='connected'>"
                      + "<span class='glyphicon glyphicon-ok' aria-hidden='true'>connect</span></h2>"
  , disconnected_html = "<h2 id='con_state'"
                      + " class='disconnected'>"
                      + "<span class='glyphicon glyphicon-remove' aria-hidden='true'>disconnect</span></h2>"
  , host              = document.location.hostname
  , socket            = io.connect('ws://' + host + ':' + 8004)

socket.on('disconnect', function(){
  $("#con_state").replaceWith(disconnected_html);
});

socket.on('connect', function(){
  $("#con_state").replaceWith(connected_html);
});

socket.on("state", function(data){
console.log(data)
});
