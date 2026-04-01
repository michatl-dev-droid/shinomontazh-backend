const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

console.log('🔄 Подключение к MongoDB...');

// Подключение к MongoDB с обработкой ошибок
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB подключена'))
  .catch(err => {
    console.error('❌ Ошибка MongoDB:', err.message);
    console.log('⚠️ Сервер продолжит работу без базы данных');
  });

// Маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/service-points', require('./routes/servicePoints'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/push', require('./routes/push'));

// Тестовые эндпоинты
app.get('/', (req, res) => {
  res.json({ 
    message: 'Сервер работает!', 
    time: new Date().toLocaleString('ru-RU'),
    env: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Глобальная обработка ошибок
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

// ЗАПУСК СЕРВЕРА — ЭТО САМОЕ ВАЖНОЕ!
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('=================================');
  console.log('✅ ОСНОВНОЙ СЕРВЕР ЗАПУЩЕН!');
  console.log(`🌐 Порт: ${PORT}`);
  console.log(`🔗 URL: http://0.0.0.0:${PORT}`);
  console.log('=================================');
});

// Корректное завершение
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});