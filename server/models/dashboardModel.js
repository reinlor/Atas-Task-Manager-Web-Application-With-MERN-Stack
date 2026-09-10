const mongoose = require('mongoose');

const dashboardSchema = new mongoose.Schema({
    stats: {
        totalTask: { type: Number, default: 0 },
        inProgress: { type: Number, default: 0 },
        completed: { type: Number, default: 0 },
        shared: { type: Number, default: 0 }
    },
    recentTask: [{
        title: { type: String },
        status: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    recentActivity: [{
        text: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Account' }
}, { timestamps: true });

module.exports = mongoose.model('Dashboard', dashboardSchema) 