const mongoose = require('mongoose');

const servicePointSchema = new mongoose.Schema({
  name: String,
  address: String,
  phone: String,
  coordinates: { lat: Number, lng: Number },
  workingHours: String
});

module.exports = mongoose.model('ServicePoint', servicePointSchema);