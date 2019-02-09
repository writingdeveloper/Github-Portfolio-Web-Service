/* Mypage */

$(document).ready(function () {
    // GET REQUEST
    $("#removeData").click(function (event) {
        event.preventDefault();
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
                ajaxPost();
            }
        })
    });

    function ajaxPost() {
        // PREPARE FORM DATA
        // let data = {
        //     email: $("#email").val(),
        //     phoneNumber: $("#phoneNumber").val(),
        //     bio: $("#bio").val()
        // }
        // DO POST
        $.ajax({
            type: "POST",
            // contentType: "application/json",
            url: `/${userId}/admin/removeData`,
            // data: JSON.stringify(data),
            // dataType: 'json',
            success: function (data) {
                // console.log(JSON.stringify(data));
                Swal.fire(
                    'Deleted!',
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