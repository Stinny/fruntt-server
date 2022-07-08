const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String, required: true },
    storeId: { type: String },
    stripeId: { type: String, default: '' },
    customerId: { type: String },
    subscriptionId: { type: String },
    stripeOnboard: { type: Boolean, default: false },
    subscribed: { type: Boolean, default: false },
    trial: { type: Boolean, default: false },
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
      trial: this.trial,
    },
    process.env.JWT_SEC,
    {
      expiresIn: '10m',
    }
  );
  return token;
};

UserSchema.methods.genRefreshToken = function () {
  const token = jwt.sign({ id: this._id }, process.env.REFRESH_SEC);
  return token;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
