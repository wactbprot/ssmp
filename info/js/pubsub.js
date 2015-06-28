var  connected_html   = "<lable id='connection_state'"
                      + " class='connected'>connect</label>"
  , disconnected_html = "<lable id='connection_state'"
                      + " class='disconnected'>disconnect</label>"
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
