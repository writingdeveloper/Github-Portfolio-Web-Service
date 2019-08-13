/* Find Users Page */

let pageNumber;

/* Load More Users Button Function */
function loadMoreUsers() {
    pageNumber = document.getElementsByClassName('col-md-3').length;
    console.log(pageNumber);
    fetch(`/find-users/moreuser/${pageNumber}`, {
        method: 'GET',
    }).then(res => res.json()).then(data => {
        console.log(data);
        if (data === 'NODATA') { // End of the Profile Data
        } else {
            for (let i = 0; i < data.length; i++) {
                let newDiv = document.createElement("div");
                newDiv.className = 'col-md-3'
                newDiv.innerHTML = `
            <div class="card mb-3 box-shadow"><img class="card-img-top" src="${data[i].avatarUrl}">
            <div class="card-body">
            <p class="card-name">${data[i].loginId}</p>
            <p class="card-text">${data[i].bio}</p>
            <div class="d-flex justify-content-between align-items-center">
            <div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary" type="button" onClick="location.href='${data[i].loginId}'">View</button>
            <button class="btn btn-sm btn-outline-secondary" type="button">Edit</button></div>
            <small class="text-muted">9 mins</small></div></div></div>
            `;
                document.getElementById("additional").appendChild(newDiv);
            }
        }
    }).catch((err) => {
        console.log(err) // Log Error
    });
}