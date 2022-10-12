const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    address: {
      country: { type: String },
      city: { type: String },
      state: { type: String },
      street: { type: String },
      zipcode: { type: String },
    },
    emailSent: { type: Boolean, default: false },
    reviewed: { type: Boolean, default: false },
    reviewedOn: { type: Date },
    rating: { type: Number },
    review: { type: String },
    storeId: { type: String },
    productId: { type: String },
    orderId: { type: String },
    orderedOn: { type: Date },
  },
  { timestamps: true }
);

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
