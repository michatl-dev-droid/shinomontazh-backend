const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ
router.post('/register', async (req, res) => {
  try {
    const { phone, password, name, carModel, carNumber } = req.body;
    
    // Проверяем, существует ли пользователь с таким телефоном
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь с таким телефоном уже существует' });
    }

    // Создаём нового пользователя
    const user = new User({
      phone,
      password, // пароль автоматически хешируется в модели User
      name,
      carModel,
      carNumber
    });

    await user.save();

    // Создаём JWT токен
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '7d' }
    );

    // Отправляем ответ без пароля
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Регистрация успешна',
      token,
      user: userResponse
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ВХОД ПОЛЬЗОВАТЕЛЯ
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Ищем пользователя по телефону
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ error: 'Неверный телефон или пароль' });
    }

    // Проверяем пароль (метод comparePassword должен быть в модели User)
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Неверный телефон или пароль' });
    }

    // Создаём JWT токен
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '7d' }
    );

    // Отправляем ответ без пароля
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user: userResponse
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ПОЛУЧИТЬ ДАННЫЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ (по токену)
router.get('/me', async (req, res) => {
  try {
    // Получаем токен из заголовка
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key');
    
    // Находим пользователя
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Отправляем ответ без пароля
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json(userResponse);
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Недействительный токен' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истёк' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ (для админки)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;