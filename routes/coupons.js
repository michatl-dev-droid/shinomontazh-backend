const router = require('express').Router();
const Coupon = require('../models/Coupon');
//const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');

// VAPID ключи
const vapidKeys = {
  publicKey: 'BCPLaX4u5uoSbQllPBB-J_LlQvpxXzEFDewLAoPZITd6yVCYwM4MJpDhLQWNr-d6BebNwjC5uBwXkhlkHnxaExg',
  privateKey: 'Z_KjvFqjhdtmxyXEp09Oa_XEL5FXRNKB6Ut_OONfhVI'
};

webpush.setVapidDetails(
  'mailto:info@мастершин24.рф',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// GET - все купоны
router.get('/', async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (err) {
    console.error('Ошибка GET /api/coupons:', err);
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
    console.error('Ошибка GET /api/coupons/active:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST - проверить купон по коду
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
    console.error('Ошибка POST /api/coupons/validate:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST - сохранить подписку на уведомления (в базу данных)
router.post('/subscribe', async (req, res) => {
  try {
    const subscription = req.body;
    
    // Проверяем, нет ли уже такой подписки
    const existingSub = await PushSubscription.findOne({ 'subscription.endpoint': subscription.endpoint });
    if (existingSub) {
      return res.status(200).json({ message: 'Подписка уже существует' });
    }
    
    // Сохраняем новую подписку
    await PushSubscription.create({ subscription });
    console.log('✅ Новая подписка сохранена');
    res.status(201).json({ message: 'Подписка сохранена' });
  } catch (err) {
    console.error('❌ Ошибка сохранения подписки:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST - создать новый купон (с уведомлением)
router.post('/', async (req, res) => {
  try {
    const coupon = new Coupon({
      code: req.body.code,
      discountPercent: Number(req.body.discount),
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      expiresAt: req.body.validUntil ? new Date(req.body.validUntil) : new Date(Date.now() + 30*24*60*60*1000)
    });
    await coupon.save();

    // --- ОТПРАВКА PUSH-УВЕДОМЛЕНИЙ ---
    /*const allSubscriptions = await PushSubscription.find();
    const notificationPayload = JSON.stringify({
      title: '🎁 Новая скидка!',
      body: `Купон ${coupon.code} — скидка ${coupon.discountPercent}%!`,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      url: '/admin/coupons'
    });

    let successCount = 0;
    for (const subDoc of allSubscriptions) {
      try {
        await webpush.sendNotification(subDoc.subscription, notificationPayload);
        successCount++;
        console.log(`✅ Уведомление отправлено подписчику ${subDoc._id}`);
      } catch (err) {
        console.error(`❌ Ошибка отправки подписчику ${subDoc._id}:`, err.message);
        // Если подписка протухла (410 Gone), удаляем её
        if (err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: subDoc._id });
          console.log(`🗑️ Устаревшая подписка ${subDoc._id} удалена`);
        }
      }
        
    }*/
    console.log(`📊 Уведомления отправлены: ${successCount} из ${allSubscriptions.length}`);

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
    console.error('Ошибка PUT /api/coupons/:id:', err);
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
    console.error('Ошибка DELETE /api/coupons/:id:', err);
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
    console.error('Ошибка PATCH /api/coupons/:id:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;