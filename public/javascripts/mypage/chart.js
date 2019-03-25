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

/* Data Process */
/* Mypage Remove All my Data From Server Function */
function removeData() {
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    type: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
    preConfirm: () => {
      return fetch(`/${userId}/admin/removeData`) // Fetch Data from server
        .then(res => res.json()).then(data => {
          let existTable = $('#dataTable').DataTable();
          // console.log(data);
          if (data === 'removed') {
            existTable
              .clear()
              .draw(); // Remove Exist Table to redraw table
          }
          return data;
        }).catch(error => {
          Swal.fire(
            'ERROR?',
            `Error Message : ${error}`,
            'error'
          )
          console.log(error);
        })
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result) => {
    // console.log(result);
    if (result.value === 'removed') {
      Swal.fire(
        'Remove Data Success',
        'There is no problem from server',
        'success'
      )
    } else if (result.dismiss === 'cancel') {
      // console.log('Canceled : DO NOTHING');
    } else {
      Swal.fire(
        'ERROR?',
        'SOMETHING IS NOT WOKRING',
        'error'
      )
    }
  })
}

/* Mypage GET Github Data Function */
let registerType;

function getData() {
  Swal.fire({
    title: 'Do you want to get data from Github?',
    text: "You won't be able to revert this!",
    type: 'info',
    showCancelButton: true,
    allowOutsideClick: false,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, Get DATA!',
    showLoaderOnConfirm: true,
    preConfirm: () => {
      return fetch(`/${userId}/admin/getData`) // Fetch Data from server
        .then(res => res.json()).then(data => {
          if (data === 'Type:Google') {
            registerType = 'Google';
          } else {
            let existTable = $('#dataTable').DataTable();
            // console.log(data);
            existTable.destroy(); // Remove Exist Table to redraw table
            $('#dataTable').DataTable({
              aaData: data, // Returned Data from Server
              aoColumns: [{
                  mData: 'id',
                  "render": function (value, type, row) {
                    return `<a href="/${userId}/${row.id}">${row.id}</a>`;
                  }
                },
                {
                  mData: 'name'
                },
                {
                  mData: 'type'
                },
                {
                  mData: 'url'
                },
                {
                  mData: 'imgurl',
                  "render": function (value, type, row) {
                    return `<img src="${row.imgurl}">`;
                  }
                },
                {
                  mData: 'sumlang'
                },
                {
                  mData: 'pjdate1'
                },
                {
                  mData: 'pjdate2'
                },
                {
                  mData: 'githuburl'
                }
              ]
            })
            return data;
          }
        }).catch(error => {
          Swal.fire(
            'ERROR?',
            'SOMETHING IS NOT WOKRING',
            'error'
          )
          console.log(error);
        })

    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result) => {
    if (result.value && registerType != 'Google') { // Register Type : Github
      Swal.fire(
        'Get Data Success',
        'There is no problem from server',
        'success'
      )
    } else if (result.value && registerType === 'Google') { // Register Type : Google
      Swal.fire(
        'Google Account!',
        'Your Account is connected with Google NO DATA!!',
        'success'
      )
    } else if (result.dismiss === 'cancel') { // Clicks Cancel
      console.log('Canceled : DO NOTHING');
    } else { // Error Handling
      Swal.fire(
        'ERROR?',
        'SOMETHING IS NOT WOKRING',
        'error'
      )
    }
  })
}