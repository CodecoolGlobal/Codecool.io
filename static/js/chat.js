import {socket} from './socket.js'

// init();

export function init() {
    chatInputField();
    chatSocketSetup();
}

function chatInputField() {
    let inputField = document.querySelector('#chat-input');
    let messageContainer = document.querySelector('.message-container');
    messageContainer.scrollTop = messageContainer.scrollHeight;
    inputField.addEventListener('keyup', function (event) {
        if (event.keyCode === 13) {
            event.preventDefault()
            let chatMessage = inputField.value
            let roomId = localStorage.getItem('room_id');
            checkGuess(roomId, chatMessage)
        }
    })
}

function chatSocketSetup() {
    socket.addEventListener('new-chat-message', (data) => {
        let messageData = JSON.parse(data);
        let messageContainer = document.querySelector('.message-container');
        let chatMessageDiv
        if (messageData['guessed']) {
            chatMessageDiv = `<div class="message guessed"><div>${messageData['username']}${messageData['message']}</div></div>`
        } else {
            chatMessageDiv = `<div class="message"><div><b>${messageData['username']}</b>${messageData['message']}</div></div>`
        }
        messageContainer.insertAdjacentHTML('beforeend', chatMessageDiv);
        messageContainer.scrollTop = messageContainer.scrollHeight;
    })
}

function checkGuess(roomId, message) {
    fetch(`/solution/${roomId}`)
        .then(response => response.json())
        .then(solution => compareGuess(solution, message, roomId))
}

function compareGuess(solution, message, roomId) {
    let username = localStorage.getItem('username');
    let guessed = false;
    if (localStorage.getItem('can_guess') === "true") {
        if (solution.toLowerCase() === message.toLowerCase()) {
            message = ` has guessed the word`;
            guessed = true
            localStorage['can_guess'] = false;
            socket.emit('update-points', JSON.stringify({room_id: roomId, player_id: localStorage.getItem('user_id')}));
        } else {
            message = ': ' + message;
        }
    } else {
        message = ': ' + message;
    }
    let data = {
        message: message,
        username: username,
        room_id: roomId,
        guessed: guessed
    }
    socket.emit('send-chat-message', JSON.stringify(data));
    document.querySelector('#chat-input').value = '';
}
