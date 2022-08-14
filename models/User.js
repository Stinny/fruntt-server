const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    password: { type: String, required: true },
    storeId: { type: String },
    stripeId: { type: String, default: '' },
    customerId: { type: String },
    subscriptionId: { type: String },
    stripeOnboard: { type: Boolean, default: false },
    subscribed: { type: Boolean, default: false },
    trial: { type: Boolean, default: false },
    sendUpdates: { type: Boolean, default: true },
    sendOrderPlaced: { type: Boolean, default: true },
    sendItemOutOfStock: { type: Boolean, default: true },
    sendReviewCollected: { type: Boolean, default: true },
    emailConfirmed: { type: Boolean, default: false },
    business: {
      name: { type: String },
      address: { type: String },
      country: { type: String },
      state: { type: String },
      city: { type: String },
      zipCode: { type: String },
    },
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
