const socket = io.connect('http://' + document.domain + ':' + location.port+'/lobby');

const RESPONSE_EVENTS = [
    'round_result',
    'new_round',
    'score_gold',
    'show_end_card',
    'update_counters',
    'gold_earned',
    'gold_stolen',
    'gold_card_earned',
    'path_card_destroyed',
    'show_goal_card',
    'path_card_played',
    'tool_status_changed',
    'draw_new_cards',
    'draw_new_role',
    'give_cards',
    'cards_discarded'
]

info = {}

socket.on('connect', () => {    
    info.username = $("#username").html();
    info.room = "/lobby";
    console.log(`Websocket ${info.username} connected!`);
    //socket.emit('join', '/home?');
    $( 'form' ).on( 'submit', function( e ) {
        console.log("info",info);
        e.preventDefault()
        let user_name = info.username;
        let user_input = $( 'input.message' ).val()
        if (user_input != '')
            socket.emit('send_message', {
            user_name : user_name,
            message : user_input
            }, room=info.room )
        $('input.message').val('').focus()
      } )
});

socket.on('receiveMessage', function(msg) {
    console.log( msg )
    if(typeof msg.user_name !== 'undefined') {
    $('div.messages').append('<div><b style="color: #000">'+msg.user_name+'</b> '+msg.message+'</div>')
    }
})

socket.on('roomsList',(rmData)=>{
    console.log(rmData);
    
    //setCookie("rooms-list", JSON.stringify(rmData), 1);
    $('.toggle').css('display','none');

    let roomListDiv = document.querySelector('.gamerooms');
    roomListDiv.innerHTML = "";
    Object.keys(rmData['roomList']).forEach(room => {
        roomListDiv.innerHTML += `<div class="room" ns="${room}">${room} - Players ${rmData['roomList'][room]}/10</div>`;
    });

    Array.from(document.getElementsByClassName('room')).forEach(room=>{
        room.addEventListener('click', e =>{
            const endpoint = room.getAttribute('ns');
            console.log("selecting: " + endpoint);
            joinGame(endpoint)
            setCookie("endpoint", endpoint, 1);
        })
    });
    createLobby();
})

socket.on('join_room', message_data => {
    info.room = message_data.room;
    console.log("join_room "+message_data); 
    buildRoomList(message_data);
});

socket.on('my_response', message_data => {
    console.log('server response '+message_data); 
});

socket.on('restore_input',createLobby);

function createLobby(){
    $('#new-room').show();//.innerHTML=`<div class="col-sm-8"><input id="lbl-new-room" type="text" placeholder="Enter Room Name" /></div><div class="col-sm-4 roomsbtn"><button class="btn btn-warning" id="create_game_room">Create Game</button></div>`;
    document.querySelector('#create_game_room').onclick = createGame;
    document.querySelector('#lbl-new-room').addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.keyCode === 13) {
            document.getElementById("create_game_room").click();
        }
    });
    if (document.querySelector('#toggle-ready').checked){
        document.querySelector('.toggle').click();
    };
}

function buildRoomList(message_data){  
    $('#new-room').hide();
    $('#event-room').show();
    document.querySelector('.gamerooms').innerHTML=`<p>Joined Room: ${message_data['room']}</p><p>${message_data['players']}</p>`;
    document.querySelector('#testP').addEventListener('click', e =>{
        socket.emit('my_room_event',{'data':"test",'room':message_data['room']})
    });
    document.querySelector('#btn-leave').addEventListener('click', e =>{
        info.room = "/lobby";
        socket.emit('leave',{'data':"test",'room':message_data['room']})
        setCookie("endpoint", "/lobby", 1);
        $('#event-room').hide();
    });
    $('.toggle').css('display','block');
}

function createGame() {
    const endpoint = document.querySelector('#lbl-new-room').value;
    console.log('Creating game...' + endpoint);
    socket.emit('create_room', {STUFF: "TO-BE DEFINED", roomId: endpoint, userId: info.username});
    setCookie("endpoint", endpoint, 1);
}

function joinGame(endpoint) {
    console.log('Joining game...' + endpoint);
    socket.emit('join_room', {roomId: endpoint, userId: info.username});
}

socket.on('disconnect', () => {
    console.log(`Websocket ${info.username} disconnected!`);
    if (document.querySelector('#toggle-ready').checked){
        document.querySelector('.toggle').click();
    };
    setCookie("endpoint", "", 1);
});

socket.on('start_game', message_data => {
    $(location).attr('href', '/game'+message_data['room']);
});

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkCookie() {
    var endpoint = getCookie("endpoint");

    if (endpoint != "") {
        console.log("cookie-check" + endpoint);
        joinGame(endpoint)
    } else {
        console.log("cookie-check" + endpoint);
    }
    
} 

//setInterval(function() {
//   if($('.toggle').css('display') == 'none' ) return;
//    socket.emit('ready_event', {'Toggle':document.querySelector('#toggle-ready').checked});
//}, 5000);



$( document ).ready(function() {
    checkCookie();
    $('.toggle').on('change',()=>{
        console.log("ready toggle");
        socket.emit('ready_event', {'Toggle':document.querySelector('#toggle-ready').checked});
    });
});

