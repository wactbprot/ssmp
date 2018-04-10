$( document ).ready(function() {
  var $chart1 = $("#chart_1")
   , $chart2 = $("#chart_2")
   , $chart3 = $("#chart_3")
   , $available1 = $("#available_1")
   , $available2 = $("#available_2")
   , $available3 = $("#available_3");

    var opt = {
        scales: {
            xAxes: [{
                type: 'linear',
                position: 'bottom'
            }]}
    }
   , chrtObj = {
        type: 'scatter',
        data: {datasets: [{
                label: 'Scatter Dataset',
                showLine: true,        
                pointRadius:5,
                data: []
              }]
            },
            options: opt
}

latest1 = 0;
latest2 = 0;
latest3 = 0;

$.ajax({
  url: "/res/info"
}).done(function(res) {
  for(i in res){
    var a = ' <a class="dropdown-item" data-path="'+res[i].join("/")+'" data-toggle="tab" href="#">'+res[i][2]+'</a>'
    $available1.append(a)
    $available2.append(a)
    $available3.append(a)
  }

  $('#chart_tab_1 a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    var path = $(this).data("path");
    chart1.data.datasets[0].label = path;
    chart1.data.datasets[0].pointBackgroundColor ='#ff6384';
    chart1.data.datasets[0].data =[];
    setInterval(function(){
      $.ajax({url:path
      }).done(function(res) {

        if(res.x > latest1){
          latest1 = res.x;
          if(chart1.data.datasets[0].data.length > 100){
            chart1.data.datasets[0].data.shift();
          }
          chart1.data.datasets[0].data.push(res);
          chart1.update()
        }
      })
    }, 1000);
  })

$('#chart_tab_2 a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    var path = $(this).data("path");
    chart2.data.datasets[0].label = path;
    chart2.data.datasets[0].pointBackgroundColor='#36a2eb';
    chart2.data.datasets[0].data =[];
    setInterval(function(){
      $.ajax({url:path
      }).done(function(res) {

        if(res.x > latest2){
          latest2 = res.x;
          if(chart2.data.datasets[0].data.length > 100){
            chart2.data.datasets[0].data.shift();
          }
          chart2.data.datasets[0].data.push(res);
          chart2.update()
        }
      })
    }, 1000);
  })

  $('#chart_tab_3 a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    var path = $(this).data("path");
    chart3.data.datasets[0].label = path;
    chart2.data.datasets[0].pointBackgroundColor='#cc65fe';
    chart3.data.datasets[0].data =[];
    setInterval(function(){
      $.ajax({url:path
      }).done(function(res) {

        if(res.x > latest3){
          latest3 = res.x;
          if(chart3.data.datasets[0].data.length > 100){
            chart3.data.datasets[0].data.shift();
          }
          chart3.data.datasets[0].data.push(res);
          chart3.update()
        }
      })
    }, 1000);
  })
});

var chart1 = new Chart($chart1, JSON.parse(JSON.stringify(chrtObj)))
var chart2 = new Chart($chart2, JSON.parse(JSON.stringify(chrtObj)))
var chart3 = new Chart($chart3, JSON.parse(JSON.stringify(chrtObj)))
});
