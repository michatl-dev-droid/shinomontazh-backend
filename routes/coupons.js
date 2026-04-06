const router = require('express').Router();
const Coupon = require('../models/Coupon');
const webpush = require('web-push');

// VAPID ключи (ваши)
const vapidKeys = {
  publicKey: 'BCPLaX4u5uoSbQllPBB-J_LlQvpxXzEFDewLAoPZITd6yVCYwM4MJpDhLQWNr-d6BebNwjC5uBwXkhlkHnxaExg',
  privateKey: 'Z_KjvFqjhdtmxyXEp09Oa_XEL5FXRNKB6Ut_OONfhVI'
};

webpush.setVapidDetails(
  'mailto:info@мастершин24.рф',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Временное хранилище подписок
let subscriptions = [];

// GET - все купоны
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - активные купоны
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({ isActive: true, expiresAt: { $gt: now } });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - проверить купон
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

// POST - сохранить подписку
router.post('/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ message: 'Подписка сохранена' });
});

// POST - создать купон (с уведомлением)
router.post('/', async (req, res) => {
  try {
    const coupon = new Coupon({
      code: req.body.code,
      discountPercent: Number(req.body.discount),
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      expiresAt: req.body.validUntil ? new Date(req.body.validUntil) : new Date(Date.now() + 30*24*60*60*1000)
    });
    await coupon.save();

    // Отправляем уведомление всем подписанным
    const payload = JSON.stringify({
      title: '🎁 Новая скидка!',
      body: `Купон ${coupon.code} — скидка ${coupon.discountPercent}%!`,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      url: '/admin/coupons'
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (err) {
        console.error('Ошибка отправки:', err);
      }
    }

    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Купон с таким кодом уже существует' });
    }
    res.status(400).json({ error: err.message });
  }
});

// PUT - обновить купон
router.put('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        code: req.body.code,
        discountPercent: Number(req.body.discount),
        isActive: req.body.isActive,
        expiresAt: req.body.validUntil ? new Date(req.body.validUntil) : undefined
      },
      { new: true, runValidators: true }
    );
    if (!coupon) return res.status(404).json({ error: 'Купон не найден' });
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE - удалить купон
router.delete('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'Купон не найден' });
    res.json({ message: 'Купон удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH - изменить статус
router.patch('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    );
    if (!coupon) return res.status(404).json({ error: 'Купон не найден' });
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;