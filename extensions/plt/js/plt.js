$( document ).ready(function() {
    var $plt = $("#plt");
    var opt = {
        scales: {
            xAxes: [{
                type: 'linear',
                position: 'bottom'
            }]
    }
    }
    data = [
        {x: 1, y: 0}
        ,{x: 2, y: 1}
        ,{x: 3, y: 2}
        ,{x: 4, y: 0}
        ,{x: 5, y: 4}
        ,{x: 6, y: 3}
        ,{x: 7, y: 5}
        ,{x: 8, y: 6}
        ,{x: 9, y: 4}
        ,{x: 10, y: 0}
        ]
    , chrtObj = {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Scatter Dataset',
                data: data
    }]
    },
options: opt
}


var chart = new Chart(plt, chrtObj)
x=1
y=1
setInterval(function(){
    x=x+1
    y=y+1
    chart.data.datasets[0].data.push({x:x, y:y})
    chart.update()
    console.log(x);
},500)

});
