const mongoose = require('mongoose');

const signupSchema = new mongoose.Schema({
  email: { type: String },
  signedUpOn: { type: Date },
});

const EmailSignup = mongoose.model('EmailSignup', signupSchema);

module.exports = EmailSignup;
