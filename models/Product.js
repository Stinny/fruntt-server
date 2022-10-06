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
    userId: { type: String },
    storeId: { type: String },
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
