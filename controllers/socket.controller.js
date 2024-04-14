module.exports = function (io) {
    const connectedClients = {};
    const connectedUsers = {};
    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on("message", (data) => {
            console.log(data)
        })

        const username = socket.handshake.query.username;
        console.log(`User ${username} connected`);

        connectedUsers[socket.id] = {
            username: socket.handshake.query.username // Assuming you pass the username as a query parameter
        };

        // Emit event to notify all clients about the updated list of online users
        io.emit('updateOnlineUsers', Object.values(connectedUsers));


        socket.on('disconnect', () => {
            console.log('A user disconnected');
            // Remove the user from the list of connected users
            delete connectedUsers[socket.id];
            // Emit event to notify all clients about the updated list of online users
            io.emit('updateOnlineUsers', Object.values(connectedUsers));
        });

        // socket.on('message', (data) => {
        //     console.log(`Message from ${data.sender}: ${data.message}`);
        //     const recipientSocket = connectedClients[data.recipient];
        //     if (recipientSocket) {
        //         recipientSocket.emit('message', data);
        //     } else {
        //         console.log(`Recipient ${data.recipient} is not online`);
        //     }
        // });

        // socket.on('disconnect', () => {
        //     console.log('A user disconnected');
        // });

        // socket.on('startConversation', (data) => {
        //     console.log(`User ${data.sender} wants to start a conversation with ${data.recipient}`);
        //     connectedClients[data.sender] = socket;
        // });
    });
};