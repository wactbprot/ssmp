var  connected_html   = "<a class='navbar-brand' id='con_state'"
                      + " class='connected'>"
                      + "<span class='glyphicon glyphicon-ok' aria-hidden='true'>"
                      + "connect"
                      + "</span>"
                      + "</a>"
  , disconnected_html = "<a class='navbar-brand' id='con_state'"
                      + " class='disconnected'>"
                      + "<span class='glyphicon glyphicon-remove' aria-hidden='true'>"
                      + "disconnect"
                      + "</span>"
                      + "</a>"
  , host              = document.location.hostname
  , socket            = io.connect('ws://' + host + ':' + 8004)

socket.on('disconnect', function(){
  $("#con_state").replaceWith(disconnected_html);
});

socket.on('connect', function(){
  $("#con_state").replaceWith(connected_html);
});

socket.on("state", function(data){
  display(data, $("#state_body"))
});


socket.on("worker", function(data){
  display(data, $("#worker_body"))
});

socket.on("exchange", function(data){
  display(data, $("#exchange_body"))
});

socket.on("recipe", function(data){
  display(data, $("#recipe_body"))
});

socket.on("start_container_obs", function(data){
  display(data, $("#container_obs_body"))
});
socket.on("stop_container_obs", function(data){
  display(data, $("#container_obs_body"))
});


var display = function(data, $id){
  var d = new Date();

  if($id.children("tr").length > 8){
    $id.children("tr").eq(9).remove();
  }
  var trstate = "<tr>"
              + "<td>" + JSON.stringify(data) + "</td>"
              + "<td>" + d.toLocaleTimeString() +" "+ d.getMilliseconds() + 1 + "</td>";
  $(trstate).hide().prependTo($id).fadeIn(400)
}


//"stop_all_container_obs"
//start_container_obs
//stop_container_obs
//update_cd
//recipe
//load_mp
