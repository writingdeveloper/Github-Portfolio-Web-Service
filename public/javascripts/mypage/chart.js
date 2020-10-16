// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#292b2c';

// CUSTOM Function
// Call the dataTables jQuery plugin
$(document).ready(function () {
  $('#dataTable').DataTable();
});

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
      data: ['39'],
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
          // max: chartMaxData + 50,
          max: 50,
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

/* Data Process */
/* Mypage Remove All my Data From Server Function */
function removeData() {
  Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        preConfirm: () => {
          return fetch(`/${userId}/admin/removeData`)
        .then(response => {
          console.log(response);
          if (!response.ok) {
            throw new Error(response.statusText)
          }
          return response.json()
        })
        .catch(error => {
          Swal.showValidationMessage(
            `Request failed: ${error}`
          )
        })
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result) => {
    console.log(result)
    if (result.isConfirmed) {
      Swal.fire({
        title: 'Remove Data Success!',
        text: "Your personal information has been safely removed from DB.",
        icon: 'success',
        confirmButtonText: `Ok`
      }).then((result) => {
        if (result.isConfirmed) {
          location.reload();
        }
      })
    }
  })
}

/* Mypage GET Github Data Function */
function getData() {
  Swal.fire({
    title: 'Do you want to get data from Github?',
    text: "You won't be able to revert this!",
    icon: 'info',
    inputAttributes: {
      autocapitalize: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Get Data',
    showLoaderOnConfirm: true,
    preConfirm: () => {
      return fetch(`/${userId}/admin/getData`)
        .then(response => {
          console.log(response);
          if (!response.ok) {
            throw new Error(response.statusText)
          }
          return response.json()
        })
        .catch(error => {
          Swal.showValidationMessage(
            `Request failed: ${error}`
          )
        })
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result) => {
    console.log(result)
    if (result.isConfirmed) {
      Swal.fire({
        title: 'Get Data Success!',
        text: "Your personal information has been safely stored in DB.",
        icon: 'success',
        confirmButtonText: `Ok`
      }).then((result) => {
        if (result.isConfirmed) {
          location.reload();
        }
      })
    }
  })
}