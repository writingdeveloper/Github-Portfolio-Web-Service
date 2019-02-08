/* Mypage */

$(document).ready(function () {
    // GET REQUEST
    $("#removeData").click(function (event) {
        event.preventDefault();
        ajaxPost();
    });

    function ajaxPost() {
        // PREPARE FORM DATA
        let data = {
            email: $("#email").val(),
            phoneNumber: $("#phoneNumber").val(),
            bio: $("#bio").val()
        }
        // DO POST
        $.ajax({
            type: "POST",
            contentType: "application/json",
            url: `/${userId}/admin/removeData`,
            data: JSON.stringify(data),
            dataType: 'json',
            success: function (data) {
                console.log(JSON.stringify(data));
                Swal.fire(
                    'Modification completed',
                    '',
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