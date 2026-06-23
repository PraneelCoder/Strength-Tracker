const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: {
    type: String,
    required: true,
    enum: ['Weight', 'Macro', 'Lift'] 
  },
  category: { type: String, required: true },
  value: { type: Number, required: true },
  date: { type: String, required: true },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Entry', entrySchema);