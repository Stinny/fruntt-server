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
      street: { type: String },
      zipcode: { type: String },
    },
    total: { type: Number },
    fulfilled: { type: Boolean, default: false },
    paid: { type: Boolean, default: false },
    storeId: { type: String },
    paymentId: { type: String, required: true },
    labelPaymentId: { type: String },
    clientId: { type: String, require: true },
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
