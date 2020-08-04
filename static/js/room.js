init();

function init() {
    let socket = io('http://127.0.0.1:5000')
    addSocketConnectionListeners(socket);
    addListenerToButton(socket);
    addSocketListenerCreatedRoom(socket);
}

function addSocketConnectionListeners(socket) {
    socket.addEventListener('connect', () => {
        console.log('we are connected to server')
    });
    socket.addEventListener('close', () => {
        console.log('connection closed')
    })

}

function addListenerToButton(socket) {
    let button = document.querySelector('#username_button')
    if (button) {
        button.addEventListener('click', () => {
            let username = document.querySelector('#username').value;
            if (username) {
                localStorage['username'] = username;
                //get room data if not exists - create, else join (or both - later)
                let userdata = {'username': username};
                socket.emit('create-room', userdata);
            }
        })
    }
}

function addSocketListenerCreatedRoom(socket) {
    socket.addEventListener('own-room-created', (event) => {
        localStorage['player_id'] = event.player_id;
        document.querySelector('#room_div').classList.add('display-none');
        console.log(event)
        let currentRoom = document.querySelector('#current_room');
        let createdRoom = `
        <div class="room" data-room="${event.room_id}">
        <p>Room (number: ${event.room_id})</p>
        <p>Players:</p>
        <ul></ul></div>`
        currentRoom.insertAdjacentHTML('beforeend', createdRoom);
        let startButton = `<div id="start_game" class=""><button>START GAME</button></div>`
        currentRoom.insertAdjacentHTML("beforeend", startButton);
        let player = `<li>${event.username}</li>`
        document.querySelector('.room ul').insertAdjacentHTML('beforeend', player);
        document.querySelector('#start_game').addEventListener('click', (event) => {
            let roomData = event.room_id;
            socket.emit('ready-to-start', roomData);

        });
    });
    socket.addEventListener('new-room-created', (event) => {
        //it receives the creator's data
        let creatorData = event['username'];
        console.log(event)
        localStorage['player_id'] = event.player_id;
        let waitingRoom = document.querySelector('#waiting_room');
        let newRoom = document.createElement('div');
        newRoom.classList.add('room');
        newRoom.innerHTML = `<p>Players:</p>
                             <ul><li>${creatorData}</li></ul>
                             <input id="username" required>
                             <button id="join_room_button" data-creator=${creatorData}>Join Room</button>`;
        waitingRoom.appendChild(newRoom);
        document.querySelector('#join_room_button').addEventListener('click', joinRoom);

        let roomInnerDiv = document.querySelector('#room_div');
        roomInnerDiv.classList.add('display-none');
        roomInnerDiv.remove();
    });
    socket.addEventListener('user-joined-a-room', (event) => {
        let player = `<li>${event.username}</li>`
        document.querySelector('.room ul').insertAdjacentHTML('beforeend', player);

    });
    socket.addEventListener('start-game', (event) => {


    })
}

function joinRoom(event) {

}
