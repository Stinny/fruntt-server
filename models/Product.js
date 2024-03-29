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
    marketplace: { type: Boolean, default: false },
    category: { type: String },
    userId: { type: String },
    free: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    storeId: { type: String },
    storeUrl: { type: String },
    numberOfSales: { type: Number, default: 0 },
    info: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
    },
    url: { type: String },
    callToAction: { type: String },
    payChoice: { type: Boolean, default: false },
    suggestedPrice: { type: String },
    link: { type: String },
    userName: { type: String },
    userPicture: { type: String },
    faqs: [
      {
        question: { type: String },
        answer: { type: String },
      },
    ],
    files: [
      { url: { type: String }, key: { type: String }, name: { type: String } },
    ],
    coverImage: { url: { type: String }, key: { type: String } },
    coverImages: [],
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;
