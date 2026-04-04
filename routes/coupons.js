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
      validUntil: { $gt: now }
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
      validUntil: { $gt: new Date() }
    });
    
    if (!coupon) {
      return res.status(404).json({ error: 'Купон не найден или истёк' });
    }
    
    res.json({ valid: true, discount: coupon.discount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== НОВЫЕ МЕТОДЫ ДЛЯ АДМИНКИ ==========

// POST - создать новый купон
router.post('/', async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT - обновить купон
router.put('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
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