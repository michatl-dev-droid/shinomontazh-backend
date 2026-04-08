const router = require('express').Router();
const Coupon = require('../models/Coupon');
const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

// VAPID ключи (вставьте свои)
const vapidKeys = {
  publicKey: 'BAzyXNGYwCspWDUflAQssR267i0AeDvzQeU6xu6imPhFdQapi6r6yZl56BQ0VVTnxLXzvAakFICLisgQU6iZsuk',
  privateKey: 'rddBqbKKAbcQ3U300uymb0-BzD4-sgKzs2ZPzzYquAI'
};

webpush.setVapidDetails(
  'mailto:info@мастершин24.рф',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// ========== ОСНОВНЫЕ МАРШРУТЫ ДЛЯ КУПОНОВ ==========

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

// POST - проверить купон по коду
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
    if (!coupon) return res.status(404).json({ error: 'Купон не найден или истёк' });
    res.json({ valid: true, discount: coupon.discountPercent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== МАРШРУТ ДЛЯ PUSH-ПОДПИСОК ==========

// POST - сохранить подписку на уведомления
router.post('/subscribe', async (req, res) => {
  try {
    const subscription = req.body;
    
    // Проверяем, есть ли уже такая подписка
    const existing = await PushSubscription.findOne({ 'subscription.endpoint': subscription.endpoint });
    if (!existing) {
      await PushSubscription.create({ subscription });
      console.log('✅ Новая подписка сохранена');
    }
    
    res.status(201).json({ message: 'Подписка сохранена' });
  } catch (err) {
    console.error('❌ Ошибка сохранения подписки:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== СОЗДАНИЕ КУПОНА (С УВЕДОМЛЕНИЕМ) ==========

// POST - создать новый купон
router.post('/', async (req, res) => {
  try {
    const coupon = new Coupon({
      code: req.body.code,
      discountPercent: Number(req.body.discount),
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      expiresAt: req.body.validUntil ? new Date(req.body.validUntil) : new Date(Date.now() + 30*24*60*60*1000)
    });
    await coupon.save();

    // === ОТПРАВКА PUSH-УВЕДОМЛЕНИЙ ===
    const subscriptions = await PushSubscription.find();
    const payload = JSON.stringify({
      title: '🎁 Новая скидка!',
      body: `Купон ${coupon.code} — скидка ${coupon.discountPercent}%!`,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      url: '/admin/coupons'
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        console.log(`✅ Уведомление отправлено`);
      } catch (err) {
        console.error(`❌ Ошибка отправки:`, err.message);
        if (err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
          console.log(`🗑️ Устаревшая подписка удалена`);
        }
      }
    }
    // === КОНЕЦ БЛОКА УВЕДОМЛЕНИЙ ===

    res.status(201).json(coupon);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Купон с таким кодом уже существует' });
    }
    console.error('❌ Ошибка создания купона:', err);
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

// PATCH - изменить статус купона
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