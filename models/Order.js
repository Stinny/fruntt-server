const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    email: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    items: [],
    shippingAddress: {
      country: { type: String },
      city: { type: String },
      state: { type: String },
      street: { type: String },
      zipcode: { type: String },
    },
    total: { type: Number },
    status: { type: String, default: 'Not Fufilled' },
    storeId: { type: String },
    paymentId: { type: String, required: true },
    clientId: { type: String, require: true },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
