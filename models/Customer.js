const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
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
  source: { type: String, default: 'Order' },
  storeId: { type: String },
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
