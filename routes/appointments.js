const router = require('express').Router();
const Appointment = require('../models/Appointment');

// ПОЛУЧИТЬ ВСЕ ЗАПИСИ (с данными пользователя, услуги и точки)
router.get('/', async (req, res) => {
  console.log('📥 GET /api/appointments - Запрос всех записей');
  
  try {
    const appointments = await Appointment.find()
      .populate('user')
      .populate('service')
      .populate('servicePoint');
    
    console.log(`✅ Найдено записей: ${appointments.length}`);
    res.json(appointments);
  } catch (err) {
    console.error('❌ Ошибка при получении записей:', err);
    res.status(500).json({ error: err.message });
  }
});

// ПОЛУЧИТЬ ЗАПИСИ КОНКРЕТНОГО ПОЛЬЗОВАТЕЛЯ
router.get('/user/:userId', async (req, res) => {
  console.log(`📥 GET /api/appointments/user/${req.params.userId} - Запрос записей пользователя`);
  
  try {
    const appointments = await Appointment.find({ user: req.params.userId })
      .populate('service')
      .populate('servicePoint');
    
    console.log(`✅ Найдено записей для пользователя: ${appointments.length}`);
    res.json(appointments);
  } catch (err) {
    console.error('❌ Ошибка при получении записей пользователя:', err);
    res.status(500).json({ error: err.message });
  }
});

// ПОЛУЧИТЬ ОДНУ ЗАПИСЬ ПО ID
router.get('/:id', async (req, res) => {
  console.log(`📥 GET /api/appointments/${req.params.id} - Запрос конкретной записи`);
  
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('user')
      .populate('service')
      .populate('servicePoint');
    
    if (!appointment) {
      console.log('❌ Запись не найдена');
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    console.log('✅ Запись найдена:', appointment._id);
    res.json(appointment);
  } catch (err) {
    console.error('❌ Ошибка при получении записи:', err);
    res.status(500).json({ error: err.message });
  }
});

// СОЗДАТЬ НОВУЮ ЗАПИСЬ
router.post('/', async (req, res) => {
  console.log('📝 POST /api/appointments - ПОЛУЧЕН ЗАПРОС НА СОЗДАНИЕ ЗАПИСИ');
  console.log('Тело запроса:', JSON.stringify(req.body, null, 2));
  console.log('Заголовки:', req.headers);
  
  try {
    // Проверка обязательных полей
    const requiredFields = ['user', 'servicePoint', 'service', 'date', 'time'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Отсутствуют обязательные поля:', missingFields);
      return res.status(400).json({ 
        error: `Отсутствуют обязательные поля: ${missingFields.join(', ')}` 
      });
    }

    // Создаём новую запись
    const appointmentData = {
      user: req.body.user,
      servicePoint: req.body.servicePoint,
      service: req.body.service,
      date: req.body.date,
      time: req.body.time,
      carModel: req.body.carModel || '',
      carNumber: req.body.carNumber || '',
      comment: req.body.comment || '',
      status: req.body.status || 'pending'
    };

    console.log('📦 Данные для сохранения:', appointmentData);
    
    const appointment = new Appointment(appointmentData);
    console.log('✅ Объект записи создан:', appointment);

    await appointment.save();
    console.log('💾 Запись сохранена в БД, ID:', appointment._id);
    
    // Загружаем связанные данные для ответа
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('user')
      .populate('service')
      .populate('servicePoint');
    
    console.log('📤 Отправляем ответ с популированной записью');
    res.status(201).json(populatedAppointment);
    
  } catch (err) {
    console.error('❌ ОШИБКА ПРИ СОХРАНЕНИИ:');
    console.error('Имя ошибки:', err.name);
    console.error('Сообщение:', err.message);
    console.error('Стек:', err.stack);
    
    // Проверка на ошибки валидации MongoDB
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    
    res.status(400).json({ error: err.message });
  }
});

// ОБНОВИТЬ ЗАПИСЬ (например, изменить статус)
router.put('/:id', async (req, res) => {
  console.log(`📝 PUT /api/appointments/${req.params.id} - Запрос на обновление записи`);
  console.log('Тело запроса:', req.body);
  
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('user')
      .populate('service')
      .populate('servicePoint');
      
    if (!appointment) {
      console.log('❌ Запись не найдена');
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    console.log('✅ Запись обновлена:', appointment._id);
    res.json(appointment);
  } catch (err) {
    console.error('❌ Ошибка при обновлении записи:', err);
    res.status(400).json({ error: err.message });
  }
});

// УДАЛИТЬ ЗАПИСЬ
router.delete('/:id', async (req, res) => {
  console.log(`📝 DELETE /api/appointments/${req.params.id} - Запрос на удаление записи`);
  
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      console.log('❌ Запись не найдена');
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    
    console.log('✅ Запись удалена:', req.params.id);
    res.json({ message: 'Запись удалена' });
  } catch (err) {
    console.error('❌ Ошибка при удалении записи:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;