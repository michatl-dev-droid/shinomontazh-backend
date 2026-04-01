const mongoose = require('mongoose');
require('dotenv').config();

async function resetDatabase() {
  try {
    console.log('🔄 Подключение к MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shinomontazh');
    console.log('✅ Подключено к MongoDB');
    
    const db = mongoose.connection.db;
    
    // Удаляем коллекцию users если существует
    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length > 0) {
      await db.collection('users').drop();
      console.log('✅ Коллекция users удалена');
    }
    
    // Пересоздаём коллекцию с правильными индексами
    console.log('🔄 Пересоздание коллекции users...');
    const User = require('./models/User');
    
    // Создаём тестового пользователя для проверки
    const testUser = new User({
      phone: 'test123',
      password: 'test123',
      name: 'Test User'
    });
    
    await testUser.save();
    console.log('✅ Тестовый пользователь создан');
    
    // Удаляем тестового пользователя
    await User.deleteOne({ phone: 'test123' });
    console.log('✅ Тестовый пользователь удалён');
    
    console.log('\n🎉 БАЗА ДАННЫХ УСПЕШНО ПЕРЕСОЗДАНА!');
    console.log('Теперь регистрация должна работать');
    
  } catch (err) {
    console.error('❌ ОШИБКА:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

resetDatabase();