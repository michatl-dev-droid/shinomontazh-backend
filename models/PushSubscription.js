const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  subscription: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);