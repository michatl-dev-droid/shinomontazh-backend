const router = require('express').Router();
const webpush = require('web-push');

// Временные ключи (замените на свои)
const vapidKeys = {
  publicKey: 'BPp7UZqPqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRq',
  privateKey: 'qRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRqRq'
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
    // Временно просто логируем
    console.log('Subscription received:', subscription);
    res.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Отправка тестового уведомления
router.post('/send-coupon', async (req, res) => {
  try {
    const { couponCode, discountPercent } = req.body;
    console.log(`Sending coupon: ${couponCode} - ${discountPercent}%`);
    res.json({ success: true, message: 'Test notification sent' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;