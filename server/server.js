// Copyright 2026 eneil
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     https://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
const activityRoute = require('./routes/activityRoute');
const dashboardRoute = require('./routes/dashboardRoute')
const authToken = require('./config/authentication')
const taskSocket = require('./sockets/taskSocket');

// Socket Io Connection
io.on('connection', (socket) => {
    socket.on('join_bell', (userId) => {
        if (userId && userId === socket.user.id) socket.join(userId);
    });
    taskSocket(io, socket);
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
app.use("/api/activity", authToken, activityRoute);
app.use("/api/ai", geminiRoute)
app.use("/api/dashboard", authToken, dashboardRoute)

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
