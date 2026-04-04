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

// ========== НОВЫЕ МЕТОДЫ ДЛЯ АДМИНКИ ==========

// POST - создать новый купон
router.post('/', async (req, res) => {
  try {
    const couponData = {
      code: req.body.code,
      discountPercent: req.body.discount,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      expiresAt: req.body.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 дней
    };
    const coupon = new Coupon(couponData);
    await coupon.save();
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT - обновить купон
router.put('/:id', async (req, res) => {
  try {
    const couponData = {
      code: req.body.code,
      discountPercent: req.body.discount,
      isActive: req.body.isActive,
      expiresAt: req.body.validUntil
    };
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      couponData,
      { new: true, runValidators: true }
    );
    if (!coupon) {
      return res.status(404).json({ error: 'Купон не найден' });
    }
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - удалить купон
router.delete('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ error: 'Купон не найден' });
    }
    res.json({ message: 'Купон удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH - изменить статус купона (активен/неактивен)
router.patch('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    );
    if (!coupon) {
      return res.status(404).json({ error: 'Купон не найден' });
    }
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;