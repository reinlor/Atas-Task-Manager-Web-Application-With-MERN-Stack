const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1'])

require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors')
const cookieParser = require('cookie-parser')
const http = require('http');

const app = express();
const server = http.createServer(app);
const { initSocket } = require('./config/socket');
const io = initSocket(server);
const PORT = process.env.PORT || 3000;

const accountRoute = require('./routes/accountRoute');
const taskRoute = require('./routes/taskRoute')
const teamRoute = require('./routes/teamRoute')
const geminiRoute = require('./routes/geminiRoute')
const notificationRoute = require('./routes/notificationRoute');
const authToken = require('./config/authentication')

// Socket Io Connection
io.on('connection', (socket) => {
    socket.on('join_bell', (userId) => {
        if (userId) socket.join(userId);
    });
});

// list of allowed uri
const allowedOrigins = [
    'http://localhost:5173',
    process.env.ORIGIN_URI
];

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser())
// TODO: Remove this log before deployment
app.use((req, res, next) => {
    console.log(`Path: ${req.path} Method: ${req.method}`);
    next();
});

// Routes
app.use("/api/account", accountRoute);
app.use("/api/task", authToken, taskRoute);
app.use("/api/team", authToken, teamRoute);
app.use("/api/notification", authToken, notificationRoute);
app.use("/api/ai", geminiRoute)

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        server.listen(PORT, () => {
            console.log(`MongoDB connected and Server is starting on port ${PORT}`)
        })
    })
    .catch((error) => {
        console.log("MongoDB Error: ", error)
    });
