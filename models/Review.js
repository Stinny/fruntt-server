const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String },
    review: { type: String, required: true },
    rating: { type: Number, required: true },
    orderId: { type: String, required: true },
    productId: { type: String },
    email: { type: String },
    storeId: { type: String },
  },
  { timestamps: true }
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
