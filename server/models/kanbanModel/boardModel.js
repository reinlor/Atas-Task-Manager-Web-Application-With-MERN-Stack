const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: Number,
    required: true,
  },
  cards: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
    },
  ],
});

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    team: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Team', 
      default: null },
    columns: {
      type: [columnSchema],
      default: [],
      validate: {
        validator: (columns) => columns.length <= 6,
        message: 'A board cannot have more than 6 columns',
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);