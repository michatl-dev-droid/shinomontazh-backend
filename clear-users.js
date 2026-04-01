const mongoose = require('mongoose');
require('dotenv').config();

async function clearUsers() {
  try {
    console.log('🔄 Подключаемся к MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shinomontazh');
    console.log('✅ Подключено к MongoDB');
    
    const db = mongoose.connection.db;
    const result = await db.collection('users').deleteMany({});
    console.log(`✅ Удалено пользователей: ${result.deletedCount}`);
    
  } catch (err) {
    console.error('❌ Ошибка:', err);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Отключено от MongoDB');
    process.exit();
  }
}

clearUsers();