const router = require('express').Router();
const Coupon = require('../models/Coupon');

// Получить все купоны
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить активные купоны
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      expiresAt: { $gt: now }
    });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Проверить купон по коду
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() }
    });
    
    if (!coupon) {
      return res.status(404).json({ error: 'Купон не найден или истёк' });
    }
    
    res.json({ valid: true, discount: coupon.discountPercent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;