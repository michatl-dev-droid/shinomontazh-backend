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
    console.error('Ошибка GET /api/coupons:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET - активные купоны (для клиентской части)
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      expiresAt: { $gt: now }
    }).sort({ createdAt: -1 }).limit(5);
    res.json(coupons);
  } catch (err) {
    console.error('Ошибка GET /api/coupons/active:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST - сохранить push-подписку
router.post('/subscribe', async (req, res) => {
  console.log('🔔 ВЫЗВАН ЭНДПОИНТ /subscribe');
  try {
    const subscription = req.body;
    const existing = await PushSubscription.findOne({ 'subscription.endpoint': subscription.endpoint });
    if (!existing) {
      await PushSubscription.create({ subscription });
      console.log('✅ Новая push-подписка сохранена');
    } else {
      console.log('ℹ️ Подписка уже существует');
    }
    res.status(201).json({ message: 'Подписка сохранена' });
  } catch (err) {
    console.error('❌ Ошибка сохранения подписки:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST - создать купон (ПРАВИЛЬНОЕ СОХРАНЕНИЕ)
router.post('/', async (req, res) => {
  try {
    console.log('📥 Данные купона:', req.body);
    
    // Определяем тип и значение скидки
    let discountType = 'percent';
    let discountValue = 0;
    
    // Приоритет: discountType + discountValue
    if (req.body.discountType && req.body.discountValue !== undefined) {
      discountType = req.body.discountType;
      discountValue = Number(req.body.discountValue);
    }
    // Если пришло discount (старый формат от фронтенда)
    else if (req.body.discount !== undefined) {
      discountType = req.body.discountType || 'percent';
      discountValue = Number(req.body.discount);
    }
    // Если пришло discountPercent (старый формат)
    else if (req.body.discountPercent !== undefined) {
      discountType = 'percent';
      discountValue = Number(req.body.discountPercent);
    }
    
    const coupon = new Coupon({
      code: req.body.code,
      discountType: discountType,
      discountValue: discountValue,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      expiresAt: req.body.expiresAt || req.body.validUntil
    });
    
    await coupon.save();
    console.log('✅ Купон сохранён:', coupon);

    // Отправка уведомлений всем подписчикам
    const subscriptions = await PushSubscription.find();
    if (subscriptions.length > 0 && vapidKeys.publicKey && vapidKeys.privateKey) {
      const discountText = discountType === 'fixed' 
        ? `${discountValue} ₽` 
        : `${discountValue}%`;
      
      const payload = JSON.stringify({
        title: '🎁 Новая скидка!',
        body: `Купон ${coupon.code} — скидка ${discountText}!`,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        url: '/my-coupons',
        count: await Coupon.countDocuments({ isActive: true, expiresAt: { $gt: new Date() } })
      });

      let successCount = 0;
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(sub.subscription, payload);
          successCount++;
          console.log(`✅ Уведомление отправлено подписчику ${sub._id}`);
        } catch (err) {
          console.error(`❌ Ошибка отправки подписчику ${sub._id}:`, err.message);
          if (err.statusCode === 410) {
            await PushSubscription.deleteOne({ _id: sub._id });
            console.log(`🗑️ Устаревшая подписка ${sub._id} удалена`);
          }
        }
      }
      console.log(`📊 Уведомления отправлены: ${successCount} из ${subscriptions.length}`);
    } else {
      console.log('ℹ️ Нет подписчиков или не настроены VAPID ключи');
    }

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
    let discountType = req.body.discountType || 'percent';
    let discountValue = Number(req.body.discountValue || req.body.discount);
    
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      {
        code: req.body.code,
        discountType: discountType,
        discountValue: discountValue,
        isActive: req.body.isActive,
        expiresAt: req.body.expiresAt || req.body.validUntil
      },
      { new: true, runValidators: true }
    );
    if (!coupon) {
      return res.status(404).json({ error: 'Купон не найден' });
    }
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
    if (!coupon) {
      return res.status(404).json({ error: 'Купон не найден' });
    }
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
    if (!coupon) {
      return res.status(404).json({ error: 'Купон не найден' });
    }
    res.json(coupon);
  } catch (err) {
    console.error('Ошибка PATCH /api/coupons/:id:', err);
    res.status(400).json({ error: err.message });
  }
});

// ВРЕМЕННЫЙ ТЕСТОВЫЙ ЭНДПОИНТ
router.get('/test', (req, res) => {
  res.json({ message: 'Сервер работает! Время: ' + new Date().toISOString() });
});

module.exports = router;