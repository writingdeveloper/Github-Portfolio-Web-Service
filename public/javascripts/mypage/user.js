/* User Page JS */

/* POST User Data with Fetch API */
function userInformationSend() {
    let data = {
        email: document.getElementById('email').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        bio: document.getElementById('bio').value
    }
    /* Use Fetch API */
    fetch(`/${userId}/admin/submit`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: new Headers({
            'Content-type': 'application/json'
        })
    }).then(res => res.json()).then(data => {
        // console.log(data);
        Swal.fire(
            'Modification completed',
            '',
            'success'
        )
    }).catch((err) => {
        Swal.fire(
            'ERROR?',
            'SOMETHING IS NOT WOKRING',
            `ERROR :${err}`
        )
    })
}