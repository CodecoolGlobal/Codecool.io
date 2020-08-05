// import {socket} from './roominit.js';
let socket = io('http://127.0.0.1:5000');

function init() {
    createSocketRooms();
    loadRooms();
    // addSocketConnectionListeners();
    // addListenerToButton();
    // addSocketListenerCreatedRoom();
}

function createSocketRooms() {
    socket.emit('create-existing-room', parseInt(localStorage['room_id']));
}

function loadRooms() {
    fetch('get-rooms')
        .then(response => response.json())
        .then(data => displayRooms(data))
        .then(addSocketConnectionListeners)
        .then(addListenerToButton)
        .then(addSocketListenerCreatedRoom)
}

function displayRooms(rooms) {
    let section;
    for (let room of rooms) {
        let players = room.player_name.split(',')
        let playersHtml = '';
        for (let player of players) {
            playersHtml += `<li class="player-datas">
                                <span class="player-name">${player}</span>
                                <img class="avatar" src="static/avatars/smurf_3.png" width="40" height="40">
                            </li>`
        }
        if (room.is_open === false) {
            section = document.querySelector('#playing_room')
            let newRoomContent = `<div class="room" data-room="${room.room_id}">
                                        <p class="room-players">Players:</p>
                                        <ul class="players-icon">
                                            ${playersHtml}
                                        </ul>
                                  </div>`;
            section.insertAdjacentHTML("beforeend", newRoomContent);
        } else if (parseInt(room['owner_id']) === parseInt(localStorage.user_id)) {
            section = document.querySelector('#current_room')

            let newRoomContent = `<div class="room" data-room="${room.room_id}">
                                        <p class="room-players">Players:</p>
                                        <ul class="players-icon">
                                            ${playersHtml}
                                        </ul>
                        
                                        <div class="join">
                                            <button id="start_game">START GAME</button>
                                        </div>
                        
                                  </div>`;

            section.insertAdjacentHTML("beforeend", newRoomContent);
            let startButton = document.querySelector('#start_game');
            startButton.addEventListener('click', (event) => {
                let roomData = event.target.closest('#current_room').querySelector('.room').dataset.room;
                socket.emit('ready-to-start', roomData);
            });
        } else {
            section = document.querySelector('#waiting_room');
            section.querySelector('#username_button').remove();
            let newRoomContent = `<div class="room" data-room="${room.room_id}">
                            <p class="room-players">Players:</p>
                            <ul class="players-icon">
                                ${playersHtml}
                            </ul>

                            <div class="join">
                                <button id="join_room_button" data-creator="${room.owner_id}">Join Room</button>
                            </div>

                        </div>`;
            section.insertAdjacentHTML("beforeend", newRoomContent);
            document.querySelector('#join_room_button').addEventListener('click', joinRoom);
        }
    }

}

function addSocketConnectionListeners() {
    socket.addEventListener('connect', () => {
        console.log('we are connected to server')
    });
    socket.addEventListener('close', () => {
        console.log('connection closed')
    });
    socket.addEventListener('save-my-id', (data) => {
        localStorage.setItem('user_id', data.player_id)
        localStorage.setItem('owner_id', data.owner_id)
    });
}

function addListenerToButton() {
    let button = document.querySelector('#username_button')
    if (button) {
        button.addEventListener('click', () => {
            let username = document.querySelector('#username').value;
            if (username) {
                localStorage['username'] = username;
                //get room data if not exists - create, else join (or both - later)
                let userdata = {'username': username};
                socket.emit('create-room', userdata);
                createUserProfile(username)
            }
        })
    }
    let joinButton = document.querySelector('#join_room_button');
    if (joinButton) {
        joinButton.addEventListener('click', joinRoom)
    }
}

function addSocketListenerCreatedRoom() {
    socket.addEventListener('own-room-created', (event) => {
        console.log(event)
        localStorage['user_id'] = event.player_id;
        localStorage['owner_id'] = event.player_id;
        localStorage['room_id'] = event.room_id;
        document.querySelector('#room_div').classList.add('display-none');
        let currentRoom = document.querySelector('#current_room');
        let createdRoom = `<div class="room" data-room="${event.room_id}">
                                <p class="room-players">Players:</p>
                                <ul class="players-icon">
                                    <li class="player-datas">
                                        <span class="player-name">${event.username}</span>
                                        <img class="avatar" src="static/avatars/smurf_3.png" width="40" height="40">
                                    </li>
                                </ul>
                
                                <div class="join">
                                    <button id="start_game">START GAME</button>
                                </div>
                
                          </div>`;
        currentRoom.insertAdjacentHTML('beforeend', createdRoom);
        // let startButton = `<div id="start_game" class=""><button>START GAME</button></div>`
        // currentRoom.insertAdjacentHTML("beforeend", startButton);
        // let player = `<li>${event.username}</li>`
        // document.querySelector('.room ul').insertAdjacentHTML('beforeend', player);
        document.querySelector('#start_game').addEventListener('click', (event) => {
            let roomData = event.target.closest('#current_room').querySelector('.room').dataset.room;
            socket.emit('ready-to-start', roomData);
        });
    });
    socket.addEventListener('new-room-created', (event) => {
        //it receives the creator's data
        let creatorName = event['username'];
        let creatorId = event['player_id'];
        let roomId = event['room_id'];
        let waitingRoom = document.querySelector('#waiting_room');
        let waitingRoomContent = `<div class="room" data-room="${roomId}">
                                    <p class="room-players">Players:</p>
                                    <ul class="players-icon">
                                        <li class="player-datas">
                                            <span class="player-name">${creatorName}</span>
                                            <img class="avatar" src="static/avatars/smurf_3.png" width="40" height="40">
                                        </li>
                                    </ul>
        
                                    <div class="join">
                                        <button id="join_room_button" data-creator="${creatorId}">Join Room</button>
                                    </div>
                                  </div>`;
        waitingRoom.insertAdjacentHTML('beforeend', waitingRoomContent);
        document.querySelector('#join_room_button').addEventListener('click', joinRoom);


    });
    socket.addEventListener('user-joined-room', (event) => {
        let player = `<li class="player-datas">
                            <span class="player-name">${event.username}</span>
                            <img class="avatar" src="static/avatars/smurf_3.png" width="40" height="40">
                        </li>`
        document.querySelector('.room ul').insertAdjacentHTML('beforeend', player);

    });
    socket.addEventListener('start-game', (event) => {
        window.location.replace('/game');
    });
}

function joinRoom(event) {
    let username = document.querySelector('#username').value;
    let roomId = event.target.parentNode.parentNode.dataset.room;
    localStorage['room_id'] = roomId;
    let ownerId = event.target.dataset.creator;
    if (username) {
        localStorage['username'] = username;
        let userdata = {'username': username, 'room_id': roomId, 'owner_id': ownerId};
        socket.emit('join-room', userdata);
        event.target.parentNode.remove();
        let newMember = `<li class="player-datas">
                            <span class="player-name">${username}</span>
                            <img class="avatar" src="static/avatars/smurf_3.png" width="40" height="40">
                        </li>`;
        document.querySelector('.room ul').insertAdjacentHTML('beforeend', newMember);
        createUserProfile(username)
    }

};

function createUserProfile(userName) {
    let userProfile = `
    <p id="user-name">Username: ${userName}</p>
    <div class="user-avatar">avatar..</div>`
    let profileContainer = document.querySelector('.profile')
    profileContainer.insertAdjacentHTML('beforeend', userProfile)
}

init();
