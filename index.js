const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

console.log('🔄 Подключение к MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB подключена'))
  .catch(err => console.error('❌ Ошибка MongoDB:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/service-points', require('./routes/servicePoints'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/push', require('./routes/push'));

app.get('/', (req, res) => {
  res.json({ message: 'Сервер работает!', time: new Date().toLocaleString('ru-RU') });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('=================================');
  console.log('✅ ОСНОВНОЙ СЕРВЕР ЗАПУЩЕН!');
  console.log(`🌐 Порт: ${PORT}`);
  console.log('=================================');
});