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
    sizeUnit: { type: String },
    weight: { type: Number },
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    userId: { type: String },
    storeId: { type: String },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
