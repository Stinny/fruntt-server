const mongoose = require('mongoose');

const StorefrontSchema = new mongoose.Schema(
  {
    userId: { type: String },
    stripeId: { type: String, default: '' },
    name: { type: String, required: true, unique: true },
    url: { type: String },
    style: {
      pageBackground: { type: String },
      navbarBackground: { type: String },
      footerBackground: { type: String },
      itemDetailsBackground: { type: String },
      itemText: { type: String },
      buttonBackground: { type: String },
      buttonTextColor: { type: String },
    },
  },
  { timestamps: true }
);

const Storefront = mongoose.model('Storefront', StorefrontSchema);

module.exports = Storefront;
