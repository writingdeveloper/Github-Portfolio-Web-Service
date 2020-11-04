/* User Page JS */

/* POST User Data with Fetch API */
function userInformationSend() {
    let data = {
        email: document.getElementById('email').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        bio: document.getElementById('bio').value
    }
    /* Use Fetch API */
    fetch(`/admin/mypage/${userId}/submit`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: new Headers({
            'Content-type': 'application/json'
        })
    }).then(res => res.json()).then(data => {
        Swal.fire(
            'Modification completed',
            '',
            'success'
        )
    }).catch((err) => {
        Swal.fire(
            'ERROR?',
            `${err}`,
            `error`
        )
    })
}