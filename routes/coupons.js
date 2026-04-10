const router = require('express').Router();
const Coupon = require('../models/Coupon');
const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

// VAPID ключи из переменных окружения
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:info@мастершин24.рф',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log('✅ VAPID ключи настроены');
} else {
  console.warn('⚠️ VAPID ключи не найдены');
}

// GET - все купоны
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
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

// POST - сохранить подписку (ЭТОТ ЭНДПОИНТ НАМ НУЖЕН)
router.post('/subscribe', async (req, res) => {
  console.log('🔔 ВЫЗВАН ЭНДПОИНТ /subscribe');
  try {
    const subscription = req.body;
    const existing = await PushSubscription.findOne({ 'subscription.endpoint': subscription.endpoint });
    if (!existing) {
      await PushSubscription.create({ subscription });
      console.log('✅ Новая push-подписка сохранена');
    }
    res.status(201).json({ message: 'Подписка сохранена' });
  } catch (err) {
    console.error('❌ Ошибка сохранения подписки:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST - создать купон
router.post('/', async (req, res) => {
  try {
    const coupon = new Coupon({
      code: req.body.code,
      discountPercent: Number(req.body.discountPercent || req.body.discount),
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      expiresAt: req.body.expiresAt || req.body.validUntil
    });
    await coupon.save();

    // Отправка уведомлений (если есть подписчики)
    const subscriptions = await PushSubscription.find();
    if (subscriptions.length > 0 && vapidKeys.publicKey) {
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
          console.error(`❌ Ошибка:`, err.message);
        }
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
        discountPercent: Number(req.body.discountPercent || req.body.discount),
        isActive: req.body.isActive,
        expiresAt: req.body.expiresAt || req.body.validUntil
      },
      { new: true }
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
// ВРЕМЕННЫЙ ТЕСТОВЫЙ ЭНДПОИНТ
router.get('/test', (req, res) => {
  res.json({ message: 'Сервер работает! Время: ' + new Date().toISOString() });
});
module.exports = router;