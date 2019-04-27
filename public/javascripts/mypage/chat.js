/* Chat Page JS */

/* Contact Search Filter */
function filter() {
    // Declare variables
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('contactSearch');
    filter = input.value.toUpperCase();
    // console.log(filter);
    ul = document.getElementById("contact");
    li = ul.getElementsByClassName('chat_list')
  
    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
      a = document.getElementsByClassName("chat_list")[i];
      txtValue = a.textContent || a.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        li[i].style.display = "";
      } else {
        li[i].style.display = "none";
      }
    }
  }


/* Chat Functions */
// let socket = io.connect(`${location.origin.replace(/^http/, 'ws')}`);
let joinedRoomName, current, others;

/* Click Each Room list Function */
function joinChat() {
    joinedRoomName = window.event.target.id; // Get clicked id (ROOM NAME)
    others = document.getElementById(joinedRoomName).innerHTML; // Talk with this person
    $('.msg_history').empty(); // to Remove Previous Chats
    $('#message').val(''); // Reset Input Area
    socket.emit('JoinRoom', {
        joinedRoomName,
        leave: current,
        receiver: userId
    });
    current = joinedRoomName;

    // Get Previous Chat Data
    fetch(`/${userId}/${joinedRoomName}/admin/getPreviousChat`).then(res => res.json()).then(data => {
        for (let i = 0; i < data.length; i++) {
            let date = data[i].chatDate;
            if (data[i].chatSender != userId) {
                $('.msg_history').append(`<div class="incoming_msg"><div class="incoming_msg_img"><img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"></div><div class="received_msg"><div class="received_withd_msg"><p>${data[i].chatMessage}</p><span class="time_date"> ${date}</span></div></div></div>`);
            } else {
                $('.msg_history').append(`<div class="outgoing_msg"><div class="sent_msg"><p>${data[i].chatMessage}</p><span class="time_date">  ${date}</span></div></div>`);
            }
        }
        Scroll(); // Scroll to Bottom
    })
}

// SET Notice Data '0' Function
function intervalCheck() {
    if (joinedRoomName === undefined) {
        // console.log('Not yet Joined');
    } else {
        socket.emit('JoinRoom', {
            joinedRoomName,
            receiver: userId
        });
        // console.log(`JOINED : ${joinedRoomName}`)
    }
}

// When Join's in the room SET notice data to '0'
setInterval(intervalCheck, 3000);

/* Scroll To Bottom in Chat Area */
function Scroll() {
    let d = $('.mesgs')
    d.scrollTop(d.prop("scrollHeight"))
}

/* SocketIO Functions */
$(function () {
    $('#message').focus(); // Init Focus to Input
    var fontColor = 'black';
    var nickName = '';
    var whoIsTyping = [];

    /* When Submit */
    $('#chat').submit(function () {
        if (joinedRoomName === undefined) {
            $('#message').val('Joined ROOM First!!');
        } else {
            //submit only if it's not empty
            if ($('#message').val() != "") {
                var msg = $('#message').val();
                socket.emit('say', {
                    msg: msg,
                    userId: userId,
                    loginedId: loginedId,
                    receiver: others,
                    joinedRoomName: joinedRoomName
                });
            }
            //say event means someone transmitted chat
            $('#message').val('');
            socket.emit('quitTyping')
        }
        return false;
    });

    /* Sending Messages Socket */
    socket.on('mySaying', function (data) {
        d = Date.now();
        d = new Date(d);
        d = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours() > 12 ? d.getHours() - 12 : d.getHours()} : ${d.getMinutes()} ${(d.getHours() >= 12 ? "PM" : "AM")}`;
        if (data.userId != userId) {
            $('.msg_history').append(`<div class="incoming_msg"><div class="incoming_msg_img"><img src="https://ptetutorials.com/images/user-profile.png" alt="sunil"></div><div class="received_msg"><div class="received_withd_msg"><p>${data.msg}</p><span class="time_date">${d}</span></div></div></div>`);
        } else {
            $('.msg_history').append(`<div class="outgoing_msg"><div class="sent_msg"><p>${data.msg}</p><span class="time_date"> ${d}</span></div></div>`);
        }
        Scroll();
    });

    /* Typing... Socket */
    socket.on('typing', function (whoIsTyping) {
        whoIsTyping = others;
        $('#message').attr('placeholder', `${whoIsTyping} is typing..`) // Typing... Message
    });

    /* End Typing Socket */
    socket.on('endTyping', function () {
        whoIsTyping = [];
        $('#message').attr('placeholder', "Type a Message"); // If Notyping Reset to Init placeholder
    })

    /* Input Typing Socket */
    $('#message').keyup(function (event) {
        if ($('#message').val() != "" && !whoIsTyping.includes(others)) {
            socket.emit('typing', {
                others,
                joinedRoomName
            });
        } else if ($('#message').val() == "" && whoIsTyping.includes(others)) {
            socket.emit('quitTyping', {
                others,
                joinedRoomName
            });
        }
    });
});