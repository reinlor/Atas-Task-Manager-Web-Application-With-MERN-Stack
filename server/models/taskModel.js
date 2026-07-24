const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        maxlength: 150
    },
    content: {  
        type: String
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Complete'],
        required: true,
        default: 'Pending'
    }
})

module.exports = mongoose.model('Task', taskSchema);