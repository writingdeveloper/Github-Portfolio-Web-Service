/* Mypage */

function removeData() {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.value) {
            $.ajax({
                type: "POST",
                // contentType: "application/json",
                url: `/${userId}/admin/removeData`,
                // data: JSON.stringify(data),
                // dataType: 'json',
                success: function (data) {
                    // console.log(JSON.stringify(data));
                    let table = $('#dataTable').DataTable();
                    table
                        .clear()
                        .draw();
                    Swal.fire(
                        'Deleted!',
                        'Your file has been deleted.',
                        'success'
                    )
                },
                beforeSend: function () {
                    Swal.showLoading()
                },
                error: function (e) {
                    Swal.fire(
                        'Failed to save',
                        'If this message is output continuously, please contact to administrator.',
                        'error'
                    )
                }
            });
        }
    })
}

/* Mypage */
function getData() {
    Swal.fire({
        title: 'Do you want to get data from Github?',
        text: "You won't be able to revert this!",
        type: 'warning',
        showCancelButton: true,
        allowOutsideClick: false,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Get DATA!',
        showLoaderOnConfirm: true,

        preConfirm: () => {
            return fetch(`/${userId}/admin/getData`)
                .then(res => res.json()).then(data => {
                    let existTable = $('#dataTable').DataTable();
                    // let data = response.json();
                    console.log(data);
                    existTable.destroy();

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
                }).catch(error => {
                    Swal.fire(
                        'ERROR?',
                        'SOMETHING IS NOTWOKRING',
                        'warning'
                    )
                    console.log(error);
                })
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then(() => {
        Swal.fire(
            'Get Data Success',
            'There is no problem from server',
            'success'
        )
    })
}