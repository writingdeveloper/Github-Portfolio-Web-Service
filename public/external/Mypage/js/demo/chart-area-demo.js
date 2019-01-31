// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#292b2c';

// CUSTOM Function

var currentDay = new Date();
var theYear = currentDay.getFullYear();
var theMonth = currentDay.getMonth();
var theDate = currentDay.getDate();
var theDayOfWeek = currentDay.getDay();

var thisWeek = [];

for (var i = 0; i < 7; i++) {
  var resultDay = new Date(theYear, theMonth, theDate - i);
  var yyyy = resultDay.getFullYear();
  var mm = Number(resultDay.getMonth()) + 1;
  var dd = resultDay.getDate();

  mm = String(mm).length === 1 ? '0' + mm : mm;
  dd = String(dd).length === 1 ? '0' + dd : dd;

  thisWeek[i] = yyyy + '-' + mm + '-' + dd;
}

// console.log(thisWeek);

// Area Chart Example
var ctx = document.getElementById("myAreaChart");
var myLineChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: thisWeek.reverse(),
    datasets: [{
      label: "Visitors",
      lineTension: 0.3,
      backgroundColor: "rgba(2,117,216,0.2)",
      borderColor: "rgba(2,117,216,1)",
      pointRadius: 5,
      pointBackgroundColor: "rgba(2,117,216,1)",
      pointBorderColor: "rgba(255,255,255,0.8)",
      pointHoverRadius: 5,
      pointHoverBackgroundColor: "rgba(2,117,216,1)",
      pointHitRadius: 50,
      pointBorderWidth: 2,
      data: visitorData,
    }],
  },
  options: {
    scales: {
      xAxes: [{
        time: {
          unit: 'date'
        },
        gridLines: {
          display: false
        },
        ticks: {
          maxTicksLimit: 7
        }
      }],
      yAxes: [{
        ticks: {
          min: 0,
          max: chartMaxData + 50,
          maxTicksLimit: 10
        },
        gridLines: {
          color: "rgba(0, 0, 0, .125)",
        }
      }],
    },
    legend: {
      display: false
    }
  }
});