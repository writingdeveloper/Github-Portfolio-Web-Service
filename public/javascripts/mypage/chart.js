// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#292b2c';

var urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('success') && urlParams.get('success')) {
  swal({
    title: "Failed",
    text: `${message}`,
    icon: "error",
    button: "Okay",
  }).then(() => {
    console.log(window.location.hostname)
    window.location.replace(window.location.origin);

  })
}


// CUSTOM Function
// Call the dataTables jQuery plugin
$(document).ready(function () {
  $('#dataTable').DataTable();
});

let chartArray =[];
for (i=0; i<7; i++){
  let d = new Date();
  d.setDate(d.getDate()-i);
  chartArray.push(d.toISOString().substr(0, 10).replace('T', ''));
}
console.log(chartArray)

// console.log(thisWeek);

// Area Chart Example
var ctx = document.getElementById("myAreaChart");
var myLineChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: chartArray.reverse(),
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
      data: chartData,
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
          max: chartMaxData,
          // max: 50,
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