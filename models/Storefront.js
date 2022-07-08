const mongoose = require('mongoose');

const StorefrontSchema = new mongoose.Schema(
  {
    userId: { type: String },
    stripeId: { type: String, default: '' },
    name: { type: String, required: true, unique: true },
    url: { type: String },
  },
  { timestamps: true }
);

const Storefront = mongoose.model('Storefront', StorefrontSchema);

module.exports = Storefront;
