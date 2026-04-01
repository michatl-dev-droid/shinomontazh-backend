const router = require('express').Router();
const webpush = require('web-push');

// Настройка VAPID ключей (замените на свои)
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'ваш_публичный_ключ',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'ваш_приватный_ключ'
};

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Сохранение подписки
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    
    // Здесь нужно сохранить subscription в базу данных
    // Например: await PushSubscription.create({ subscription, userId: req.user?.id });
    
    res.json({ success: true, message: 'Подписка сохранена' });
  } catch (err) {
    console.error('Error saving subscription:', err);
    res.status(500).json({ error: err.message });
  }
});

// Отправка уведомления о купоне
router.post('/send-coupon', async (req, res) => {
  try {
    const { couponCode, discountPercent } = req.body;
    
    // Здесь нужно получить все подписки из базы
    // const subscriptions = await PushSubscription.find();
    
    const payload = JSON.stringify({
      title: '🎁 Новая скидка!',
      body: `Купон ${couponCode} — скидка ${discountPercent}%!`,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: {
        url: '/admin/coupons'
      }
    });
    
    // Отправка уведомлений всем подписчикам
    // for (const sub of subscriptions) {
    //   try {
    //     await webpush.sendNotification(sub.subscription, payload);
    //   } catch (err) {
    //     console.error('Error sending push:', err);
    //   }
    // }
    
    res.json({ success: true, message: 'Уведомления отправлены' });
  } catch (err) {
    console.error('Error sending coupon notification:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;