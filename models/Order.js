const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    email: { type: String },
    name: { type: String },
    country: {},
    zipcode: { type: String },
    item: {},
    qty: { type: Number },
    options: {},
    total: { type: Number },
    fulfilled: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
    storeId: { type: String },
    paymentId: { type: String },
    clientId: { type: String },
    viewed: { type: Boolean, default: false },
    reviewed: { type: Boolean, default: false },
    review: {
      content: { type: String },
      rating: { type: Number },
    },
    reviewId: { type: String },
    customerId: { type: String },
    labelUrl: { type: String },
    labelId: { type: String },
    placedOn: { type: Date },
    fulfilledOn: { type: Date },
    trackingNumber: { type: String },
    manualTrackingNumber: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
