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
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Get DATA!'
    }).then((result) => {
        if (result.value) {
            $.ajax({
                type: "POST",
                // contentType: "application/json",
                url: `/${userId}/admin/getData`,
                dataType: "json",
                // dataType: 'json',
                beforeSend: function () {
                    Swal.showLoading()
                },
                success: function (redrawData) {
                    console.log(JSON.stringify(redrawData));
                    let existTable = $('#dataTable').DataTable();
                    existTable.destroy();
                    $('#dataTable').DataTable({
                        aaData: redrawData, // Returned Data from Server
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
                                mData: 'image'
                            },
                            {
                                mData: 'keyword'
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
                            // {
                            //     mData: 'name'
                            // },
                            // {
                            //     mData: 'type',
                            //     render: function (value, type, row) {
                            //         var val = [];
                            //         $.each(value, function (i, v) {
                            //             val.push(v['name']);
                            //         })
                            //         return val;
                            //     }
                            // }
                        ]
                    })
                    Swal.fire(
                        'Get!',
                        'Your file has been deleted.',
                        'success'
                    )
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