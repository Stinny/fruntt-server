const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  storeId: { type: String },
  visitedOn: { type: Date },
});

const Visit = mongoose.model('Visit', visitSchema);

module.exports = Visit;
