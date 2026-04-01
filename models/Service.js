const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  carType: { type: String, enum: ['passenger', 'suv', 'truck'] }
});

module.exports = mongoose.model('Service', serviceSchema);