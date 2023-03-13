const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    images: [{ url: { type: String }, key: { type: String } }],
    price: { type: Number, required: true },
    priceLabel: { type: String },
    stock: { type: Number },
    type: { type: String, default: 'physical' },
    digitalType: { type: String },
    published: { type: Boolean, required: true, default: true },
    weightUnit: { type: String },
    weight: { type: Number },
    shippingPrice: { type: Number },
    userId: { type: String },
    storeId: { type: String },
    numberOfSales: { type: Number, default: 0 },
    info: {
      type: String,
      default:
        '{"blocks":[{"key":"dbjri","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
    },
    content: {
      type: String,
      default:
        '{"blocks":[{"key":"dbjri","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}',
    },
    shipsFrom: {
      address: { type: String },
      country: { type: String },
      state: { type: String },
      city: { type: String },
      zipcode: { type: String },
    },
    link: { type: String },
    faqs: [
      {
        question: { type: String },
        answer: { type: String },
      },
    ],
    options: [],
    files: [
      { url: { type: String }, key: { type: String }, name: { type: String } },
    ],
    coverImage: { url: { type: String }, key: { type: String } },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
