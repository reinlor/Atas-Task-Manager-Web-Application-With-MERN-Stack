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
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
    created: { type: Date, default: Date.now },
    update: { type: Date }
})

taskSchema.pre('save', async function(){
    if (!this.isNew) {
        this.update = Date.now();
    }
})

taskSchema.methods.myId = async function(){
    return this.createdBy
}

module.exports = mongoose.model('Task', taskSchema);