const io = require('socket.io-client');

const socket = io('http://192.168.0.104:5000', {
    query: {
        username: 'tushar' // Replace 'YourUsername' with the actual username
    }
});

socket.on('connect', () => {
    console.log('Connected to the Socket.IO server');
});

function updateOnlineUsers(users) {
    
    users.forEach(user => {
        console.log(user)
    });
}


socket.on('updateOnlineUsers', (users) => {
    updateOnlineUsers(users);
});