const mongoose = require('mongoose');
require('dotenv').config();

async function createAppointment() {
  try {
    console.log('🔄 Подключение к MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Подключено к MongoDB');

    const db = mongoose.connection.db;
    const appointments = db.collection('appointments');

    // ID пользователя из вашего вывода
    const userId = "69b84e004fec2f8ea73d0a0c";
    
    // Создаём тестовую запись
    const appointment = {
      user: new mongoose.Types.ObjectId(userId),
      servicePoint: new mongoose.Types.ObjectId(), // временный ID
      service: new mongoose.Types.ObjectId(),      // временный ID
      date: new Date("2026-03-17"),
      time: "14:00",
      carModel: "Toyota Camry",
      carNumber: "А123БВ777",
      status: "pending",
      createdAt: new Date()
    };

    console.log('📝 Создаём запись:', appointment);

    const result = await appointments.insertOne(appointment);
    console.log('✅ Запись создана с ID:', result.insertedId);

    // Проверим, что запись создалась
    const created = await appointments.findOne({ _id: result.insertedId });
    console.log('✅ Созданная запись:', created);

  } catch (err) {
    console.error('❌ Ошибка:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

createAppointment();