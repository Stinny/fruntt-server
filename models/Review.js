const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  content: { type: String, required: true },
  rating: { type: Number, required: true },
  customerId: { type: String, required: true },
  orderId: { type: String, required: true },
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
