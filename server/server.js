const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1'])

require('dotenv').config()
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require('cors')
const PORT = process.env.PORT || 3000;
const URI = process.env.ORIGIN_URI || 'http://localhost:5173'
const cookieParser = require('cookie-parser')

const accountRoute = require('./routes/accountRoute');
const taskRoute = require('./routes/taskRoute')
const geminiRoute = require('./routes/geminiRoute')

const authToken = require('./config/authentication')

// Middleware
app.use(cors({
    origin: URI,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser())
app.use((req, res, next) => {
    console.log(`Path: ${req.path} Method: ${req.method}`);
    next();
});

// Routes
app.use("/api/account", accountRoute);
app.use("/api/task", authToken, taskRoute);
app.use("/api/ai", geminiRoute)

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`MongoDB connected and Server is starting on port ${PORT}`)
        })
    })
    .catch((error) => {
        console.log("MongoDB Error: ", error)
    });
