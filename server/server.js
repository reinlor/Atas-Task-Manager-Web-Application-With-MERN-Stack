const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const mongoose = require("mongoose");
const http = require('http');

const app = require('./app');
const server = http.createServer(app);
const { initSocket } = require('./config/socket');
const io = initSocket(server);
const PORT = process.env.PORT || 3000;

// Socket
const taskSocket = require('./sockets/taskSocket');
const boardSocket = require('./sockets/boardSocket');

// Socket Io Connection
io.on('connection', (socket) => {
    socket.on('join_bell', (userId) => {
        if (userId && userId === socket.user.id) socket.join(userId);
    });
    taskSocket(io, socket);
    boardSocket(io, socket);
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        server.listen(PORT, () => {
            console.log(`MongoDB connected and Server is starting on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log("MongoDB Error: ", error);
    });