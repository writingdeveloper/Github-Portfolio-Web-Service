/* Chat Page JS */
let socket = io.connect();
// socket.on('connect', function(){});

/* Contact Search Filter */
function filter() {
    // Declare variables
    let input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('contactSearch');
    filter = input.value.toUpperCase();
    // console.log(filter);
    ul = document.getElementById("contact");
    li = ul.getElementsByClassName('chat_list')

    // Loop through all list items, and hide those who don't match the search query
    for (let i = 0; i < li.length; i++) {
        a = document.getElementsByClassName("chat_list")[i];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}

/* Back to Contact list Button Action in Mobile web */
document.getElementById('contactListButton').onclick = function () {
    let buttonElement = document.getElementById('contactListButton');
    let mesgElement = document.getElementsByClassName('mesgs')[0];
    let contactList = document.getElementsByClassName('inbox_people')[0];
    let typeMessage = document.getElementsByClassName('type_msg')[0];
    contactList.style.display = "block";
    buttonElement.style.display = 'none';
    mesgElement.style.display = 'none';
    typeMessage.style.display = 'none';

    let elem = document.getElementById('content-wrapper');
    elem.style.gridTemplateAreas = '"l l l l l l l l" "l l l l l l l l" "l l l l l l l l" "l l l l l l l l" "l l l l l l l l" "l l l l l l l l"';
}

/* Responsive (Mobile) Display */
function responsiveMobileDisplay() {
    let buttonElement = document.getElementById('contactListButton');
    let mesgElement = document.getElementsByClassName('mesgs')[0];
    let contactList = document.getElementsByClassName('inbox_people')[0];
    let typeMessage = document.getElementsByClassName('type_msg')[0];
    let elem = document.getElementById('content-wrapper');

    contactList.style.display = "none";
    buttonElement.style.display = 'block';
    mesgElement.style.display = 'block';
    typeMessage.style.display = 'inline';
    elem.style.gridTemplateAreas = '"b b b b b b b b" "m m m m m m m m" "m m m m m m m m" "m m m m m m m m" "m m m m m m m m" "t t t t t t t t"';
}

/*  Responsive (Desktop) Display */
function responsiveDesktopDisplay() {
    let typeMessage = document.getElementsByClassName('type_msg')[0];
    let mesgElement = document.getElementsByClassName('mesgs')[0];
    let elem = document.getElementById('content-wrapper');
    mesgElement.style.display = 'block';
    typeMessage.style.display = 'inline';
    elem.style.gridTemplateAreas = '"l l m m m m m m" "l l m m m m m m" "l l m m m m m m" "l l m m m m m m" "l l m m m m m m" "l l t t t t t t"';

}

/* Chat Functions */
let joinedRoomName, current, others;

/* Click Each Room list Function */
function joinChat() {
    let screenWidth = $(document).width();
    if (screenWidth < 800) {
        responsiveMobileDisplay();
    } else {
        responsiveDesktopDisplay();
    }
    joinedRoomName = window.event.target.id; // Get clicked id (ROOM NAME)
    console.log(joinedRoomName)
    others = document.getElementById(joinedRoomName).innerHTML; // Talk with this person
    $('.msg_history').empty(); // to Remove Previous Chats
    $('#message').val(''); // Reset Input Area
    socket.emit('JoinRoom', {
        joinedRoomName,
        leave: current,
        receiver: userId
    });
    current = joinedRoomName;
    console.log(`/admin/mypage/chat/${joinedRoomName}`)
    // Get Previous Chat Data
    fetch(`/admin/mypage/chat/${joinedRoomName}`).then(res => res.json()).then(data => {
        console.log(data);
        for (let i = 0; i < data.length; i++) {
            let date = data[i].chatCreated;
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
    let fontColor = 'black';
    let nickName = '';
    let whoIsTyping = [];

    /* Submit Event (Keyboard Enter) */
    $('#chat').submit(function () {
        if (joinedRoomName === undefined) {
            $('#message').val('Joined ROOM First!!');
        } else {
            //submit only if it's not empty
            if ($('#message').val() != "") {
                let msg = $('#message').val();
                socket.emit('say', {
                    msg: msg,
                    userId: userId,
                    loginedId: userId,
                    receiver: others,
                    joinedRoomName: joinedRoomName
                });
            }
            // Say event means someone transmitted chat
            $('#message').val('');
            socket.emit('quitTyping')
        }
        return false;
    });

    /* Click Event (Click Send Button) */
    $('.msg_send_btn').click(function () {
        if (joinedRoomName === undefined) {
            $('#message').val('Joined ROOM First!!');
        } else {
            //submit only if it's not empty
            if ($('#message').val() != "") {
                let msg = $('#message').val();
                socket.emit('say', {
                    msg: msg,
                    userId: userId,
                    loginedId: userId,
                    receiver: others,
                    joinedRoomName: joinedRoomName
                });
            }
            // Say event means someone transmitted chat
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
            $('#chatData').text(`${data.msg}`)
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