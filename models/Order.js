const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    email: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    products: [
      {
        productId: { type: String },
        quantity: { type: Number, default: 1 },
      },
    ],
    shippingAddress: {
      country: { type: String, required: true },
      city: { type: String, require: true },
      state: { type: String, required: true },
      street: { type: String, required: true },
      zipcode: { type: String, required: true },
    },
    total: { type: Number },
    status: { type: String, default: 'pending' },
    storeId: { type: String },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
