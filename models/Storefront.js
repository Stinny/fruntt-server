const mongoose = require('mongoose');

const StorefrontSchema = new mongoose.Schema(
  {
    userId: { type: String },
    stripeId: { type: String, default: '' },
    name: { type: String, required: true, unique: true },
    url: { type: String },
    visits: { type: Number, default: 0 },
    style: {
      pageBackground: { type: String, default: '#ffffff' },
      navbarBackground: { type: String, default: '#b4bbc1' },
      footerBackground: { type: String, default: '#000000' },
      pageText: { type: String, default: '#000000' },
      buttonColor: { type: String, default: '#000000' },
      buttonTextColor: { type: String, default: '#000000' },
      socialIcons: { type: String, default: '#ffffff' },
      buttonStyle: { type: String, default: 'outlined' },
      hideNav: { type: Boolean, default: false },
      hideFooter: { type: Boolean, default: false },
    },
    logo: {
      url: { type: String },
      key: { type: String },
    },
    links: {
      facebook: { type: String, default: '' },
      youtube: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

const Storefront = mongoose.model('Storefront', StorefrontSchema);

module.exports = Storefront;
