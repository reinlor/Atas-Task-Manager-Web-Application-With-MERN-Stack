const express = require("express");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const app = express();

// Routes
const accountRoute = require('./routes/accountRoute');
const taskRoute = require('./routes/taskRoute');
const teamRoute = require('./routes/teamRoute');
const geminiRoute = require('./routes/geminiRoute');
const notificationRoute = require('./routes/notificationRoute');
const activityRoute = require('./routes/activityRoute');
const dashboardRoute = require('./routes/dashboardRoute');
const cardRoute = require('./routes/kanbanRoute/cardRoute');
const boardRoute = require('./routes/kanbanRoute/boardRoute');

const authToken = require('./config/authentication');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        frameAncestors: [
          "'self'", 
          'http://localhost:5173', 
          process.env.ORIGIN_URI
        ],
      },
    },
  })
);

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
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
        console.log(`Path: ${req.path} Method: ${req.method}`);
        next();
    });
}

// Routes
app.use("/api/account", accountRoute);
app.use("/api/board", authToken, boardRoute);
app.use("/api/card", authToken, cardRoute);
app.use("/api/task", authToken, taskRoute);
app.use("/api/team", authToken, teamRoute);
app.use("/api/notification", authToken, notificationRoute);
app.use("/api/activity", authToken, activityRoute);
app.use("/api/ai", geminiRoute);
app.use("/api/dashboard", authToken, dashboardRoute);

module.exports = app;