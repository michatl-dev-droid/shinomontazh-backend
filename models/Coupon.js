const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  discountType: {
    type: String,
    enum: ['percent', 'fixed'],
    default: 'percent'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  // Добавляем поле discountPercent, чтобы удовлетворить старой валидации
  discountPercent: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Хук для автоматического обновления discountPercent перед сохранением
couponSchema.pre('save', function(next) {
  this.discountPercent = this.discountType === 'percent' ? this.discountValue : 0;
  next();
});

module.exports = mongoose.model('Coupon', couponSchema);