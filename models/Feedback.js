const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: String },
    content: { type: String },
    type: { type: String },
    allowContact: { type: Boolean },
  },
  { timestamps: true }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
