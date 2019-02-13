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
                    console.log(data);
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
        console.log(result);
        if (result.value === 'removed') {
            Swal.fire(
                'Remove Data Success',
                'There is no problem from server',
                'success'
            )
        } else if (result.dismiss === 'cancel') {
            console.log('Canceled : DO NOTHING');
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
                    let existTable = $('#dataTable').DataTable();
                    console.log(data);
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
        console.log(result);
        if (result.value) {
            Swal.fire(
                'Get Data Success',
                'There is no problem from server',
                'success'
            )
        } else if (result.dismiss === 'cancel') {
            console.log('Canceled : DO NOTHING');
        } else {
            Swal.fire(
                'ERROR?',
                'SOMETHING IS NOT WOKRING',
                'error'
            )
        }
    })
}