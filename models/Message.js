const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    email: { type: String },
    name: { type: String },
    message: { type: String },
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
