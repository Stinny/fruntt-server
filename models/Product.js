const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ url: { type: String }, key: { type: String } }],
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    type: { type: String, default: 'Physical' },
    published: { type: Boolean, required: true, default: false },
    userId: { type: String },
    storeId: { type: String },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
