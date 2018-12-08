const socket = io.connect('http://' + document.domain + ':' + location.port+'/lobby');

function load_game_rooms(data) {
    // to bind
    return false;
}

socket.on('connect', () => {
   console.log(`Websocket ${socket.id} connected!`);
   //socket.emit('join', '/home?');
});

socket.on('roomsList',(rmData)=>{
    console.log(rmData);

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
        })
    });
})

socket.on('join_room', message_data => {
  console.log(message_data); 
});

socket.on('my_response', message_data => {
    console.log('server response '+message_data); 
  });

function createGame() {
    const endpoint = document.querySelector('#new-room').value;
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
