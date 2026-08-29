const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
        role: { type: String, enum: ['Editor', 'Viewer'], default: 'Editor' }
    }]
});

module.exports = mongoose.model('Team', teamSchema);