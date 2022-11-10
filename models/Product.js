const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    images: [{ url: { type: String }, key: { type: String } }],
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    type: { type: String, default: 'Physical' },
    published: { type: Boolean, required: true, default: false },
    weightUnit: { type: String },
    weight: { type: Number },
    shippingPrice: { type: Number },
    userId: { type: String },
    storeId: { type: String },
    ali: { type: Boolean, default: false },
    numberOfSales: { type: Number, default: 0 },
    aliShipsFrom: { type: String },
    aliShipsTo: { type: String },
    aliImages: [],
    aliRating: { type: Number },
    aliUrl: { type: String },
    aliReviews: [
      {
        date: { type: Date },
        rating: { type: Number },
        content: { type: String },
      },
    ],
    freeShipping: { type: Boolean, default: false },
    shipsFrom: {
      address: { type: String },
      country: { type: String },
      state: { type: String },
      city: { type: String },
      zipcode: { type: String },
    },
    faqs: [
      {
        question: { type: String },
        answer: { type: String },
      },
    ],
    options: [],
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
