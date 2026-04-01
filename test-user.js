const mongoose = require('mongoose');
require('dotenv').config();

async function testUser() {
  try {
    console.log('🔄 Подключение к MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    const User = require('./models/User');

    // Удаляем старого тестового пользователя
    await User.deleteMany({ phone: 'test123' });
    
    // Создаём пользователя
    const user = new User({
      phone: 'test123',
      password: '123456',
      name: 'Test User'
    });

    await user.save();
    console.log('✅ Пользователь создан');
    console.log('🔑 Сохранённый пароль (должен быть хешем):', user.password);

    // Проверяем правильный пароль
    const isMatch = await user.comparePassword('123456');
    console.log('✅ Пароль 123456 совпадает:', isMatch ? 'да' : 'нет');

    // Проверяем неправильный пароль
    const isMatchWrong = await user.comparePassword('wrongpass');
    console.log('✅ Пароль wrongpass совпадает:', isMatchWrong ? 'да' : 'нет');

    // Удаляем тестового пользователя
    await User.deleteMany({ phone: 'test123' });
    console.log('✅ Тестовый пользователь удалён');

  } catch (err) {
    console.error('❌ Ошибка:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testUser();