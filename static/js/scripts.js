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


socket.on('connect', () => {
   console.log(`Websocket ${socket.id} connected!`);
   //socket.emit('join', '/home?');
});

socket.on('roomsList',(rmData)=>{
    console.log(rmData);
    
    //setCookie("rooms-list", JSON.stringify(rmData), 1);

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
})

socket.on('join_room', message_data => {
  console.log("join_room "+message_data); 
  buildRoomList(message_data);
});

socket.on('my_response', message_data => {
    console.log('server response '+message_data); 
});

socket.on('restore_input', message_data => {
    document.querySelector('#new-room').innerHTML=`<div class="col-sm-8"><input id="lbl-new-room" type="text" placeholder="Enter Room Name" /></div><div class="col-sm-4 roomsbtn"><button id="create_game_room">Create Game</button></div>`;
});

function buildRoomList(message_data){
  document.querySelector('#new-room').innerHTML=`<button class="btn btn-warning" id="testP">TestEvent</button><button class="btn btn-warning" id="btn-leave">Leave Room</button>`;
  document.querySelector('.gamerooms').innerHTML=`<p>Joined Room: ${message_data['room']}</p><p>${message_data['players']}</p>`;
  document.querySelector('#testP').addEventListener('click', e =>{
    socket.emit('my_room_event',{'data':"test",'room':message_data['room']})
  });
  document.querySelector('#btn-leave').addEventListener('click', e =>{
    socket.emit('leave',{'data':"test",'room':message_data['room']})
    setCookie("endpoint", "/lobby", 1);
  });
}

function createGame() {
    const endpoint = document.querySelector('#lbl-new-room').value;
    console.log('Creating game...' + endpoint);
    socket.emit('create_room', {STUFF: "TO-BE DEFINED", roomId: endpoint, userId: socket.id});
}

function joinGame(endpoint) {
    console.log('Joining game...' + endpoint);
    socket.emit('join_room', {roomId: endpoint, userId: socket.id});
}

$(()=>{
    document.querySelector('#create_game_room').onclick = createGame;
})

socket.on('disconnect', () => {
    console.log(`Websocket ${socket.id} disconnected!`);
    
    setCookie("endpoint", "", 1);
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
        console.log("cookie-check" + endpoint)
        joinGame(endpoint)
    } 
    
  } 
  checkCookie()