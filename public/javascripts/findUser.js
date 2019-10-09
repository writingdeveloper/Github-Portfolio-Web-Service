/* Find Users Page */
let removeElements = elms => elms.forEach(el => el.remove());

/* Search Users Button Function */
function searchUsers() {
  let queryString = document.getElementById("searchUsers").value;
  if (['', '{', '}', '{}'].includes(queryString)) {
    removeElements(document.querySelectorAll(".col-md-3"));
    removeElements(document.querySelectorAll("#loadMoreUsers"));
    removeElements(document.querySelectorAll(".alert"));
    let newDiv = document.createElement("div");
    newDiv.innerHTML = `<div class="alert alert-danger" role="alert">
          Enter skills or some information!
        </div>`
    document.getElementById("container").appendChild(newDiv);
  } else {
    /* Fetch Data */
    fetch(`/find-users/${queryString}`, { // Request Search Data to DB server
        method: "GET"
      })
      .then(res => res.json())
      .then(data => {
        if (data === "NODATA") {
          // End of the Profile Data
          removeElements(document.querySelectorAll(".col-md-3"));
          removeElements(document.querySelectorAll("#loadMoreUsers"));
          removeElements(document.querySelectorAll(".alert"));
          let newDiv = document.createElement("div");
          newDiv.innerHTML = `<div class="alert alert-danger" role="alert">
          No Result
        </div>`
          document.getElementById("container").appendChild(newDiv);
        } else {

          // Remove Exist Profile Data
          removeElements(document.querySelectorAll(".col-md-3"));
          removeElements(document.querySelectorAll(".alert"));

          for (let i = 0; i < data.length; i++) {
            let newDiv = document.createElement("div");
            newDiv.className = "col-md-3";
            // Append new profile HTML
            newDiv.innerHTML = `
            <div class="card mb-3 box-shadow"><img class="card-img-top" src="${
              data[i].avatarUrl
            }">
            <div class="card-body">
            <b><p class="card-name">${data[i].loginId}</p></b>
            <p class="card-text">${data[i].bio}</p>
            <div class="d-flex justify-content-between align-items-center">
            <div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary" type="button" onClick="location.href='${
              data[i].loginId
            }'">View</button>
            <button class="btn btn-sm btn-outline-secondary" type="button" onClick="location.href='${
              data[i].loginId
            }/contact'">Contact</button></div>
            <small class="text-muted">View Score : ${data[i].counter}</small></div></div></div>
            `;
            document.getElementById("additional").appendChild(newDiv);
          }
        }
      })
      .catch(err => {
        console.log(err); // Log Error
      });
  }
}

/* Load More Users Button Function */
function loadMoreUsers() {
  let pageNumber = document.getElementsByClassName("col-md-3").length;
  /* Fetch Data */
  fetch(`/find-users/moreuser/${pageNumber}`, {
      method: "GET"
    })
    .then(res => res.json())
    .then(data => {
      if (data === "NODATA") {
        // End of the Profile Data
        removeElements(document.querySelectorAll("#loadMoreUsers"));
      } else {
        for (let i = 0; i < data.length; i++) {
          let newDiv = document.createElement("div");
          newDiv.className = "col-md-3";
          // Append new profile HTML
          newDiv.innerHTML = `
            <div class="card mb-3 box-shadow"><img class="card-img-top" src="${
              data[i].avatarUrl
            }">
            <div class="card-body">
            <b><p class="card-name">${data[i].loginId}</p></b>
            <p class="card-text">${data[i].bio}</p>
            <div class="d-flex justify-content-between align-items-center">
            <div class="btn-group">
            <button class="btn btn-sm btn-outline-secondary" type="button" onClick="location.href='${
              data[i].loginId
            }'">View</button>
            <button class="btn btn-sm btn-outline-secondary" type="button" onClick="location.href='${
              data[i].loginId
            }/contact'">Contact</button></div>
            <small class="text-muted">View Score : ${data[i].counter}</small></div></div></div>
            `;
          document.getElementById("additional").appendChild(newDiv);
        }
      }
    })
    .catch(err => {
      console.log(err); // Log Error
    });
}