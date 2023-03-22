const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    email: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    item: {},
    qty: { type: Number },
    shippingAddress: {
      country: { type: String },
      city: { type: String },
      state: { type: String },
      address: { type: String },
      zipcode: { type: String },
    },
    shipsFrom: {
      country: { type: String },
      city: { type: String },
      state: { type: String },
      address: { type: String },
      zipcode: { type: String },
    },
    options: {},
    total: { type: Number },
    fulfilled: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
    storeId: { type: String },
    paymentId: { type: String, required: true },
    clientId: { type: String, require: true },
    reviewed: { type: Boolean, default: false },
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
