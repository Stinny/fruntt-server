const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
    storeId: { type: String },
    stripeId: { type: String },
    stripeOnboard: { type: Boolean, default: false },
  },
  { timestamps: true }
);

//gens a jwt token with user data
UserSchema.methods.genAccessToken = function () {
  const token = jwt.sign(
    {
      id: this._id,
      email: this.email,
      storeId: this.storeId,
      stripeId: this.stripeId,
      stripeOnboard: this.stripeOnboard,
    },
    process.env.JWT_SEC
  );
  return token;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
