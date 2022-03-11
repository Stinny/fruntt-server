const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    storeId: { type: String },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

//gens a jwt token with user data
UserSchema.methods.genAccessToken = function () {
  const token = jwt.sign(
    {
      id: this._id,
    },
    process.env.JWT_SEC
  );
  return token;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
