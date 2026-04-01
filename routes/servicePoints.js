const router = require('express').Router();
const ServicePoint = require('../models/ServicePoint');

// ПОЛУЧИТЬ ВСЕ ТОЧКИ
router.get('/', async (req, res) => {
  try {
    const points = await ServicePoint.find();
    res.json(points);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ПОЛУЧИТЬ ОДНУ ТОЧКУ ПО ID
router.get('/:id', async (req, res) => {
  try {
    const point = await ServicePoint.findById(req.params.id);
    if (!point) {
      return res.status(404).json({ error: 'Точка не найдена' });
    }
    res.json(point);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// СОЗДАТЬ НОВУЮ ТОЧКУ
router.post('/', async (req, res) => {
  try {
    const point = new ServicePoint(req.body);
    await point.save();
    res.status(201).json(point);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ОБНОВИТЬ ТОЧКУ
router.put('/:id', async (req, res) => {
  try {
    const point = await ServicePoint.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!point) {
      return res.status(404).json({ error: 'Точка не найдена' });
    }
    res.json(point);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// УДАЛИТЬ ТОЧКУ
router.delete('/:id', async (req, res) => {
  try {
    const point = await ServicePoint.findByIdAndDelete(req.params.id);
    if (!point) {
      return res.status(404).json({ error: 'Точка не найдена' });
    }
    res.json({ message: 'Точка удалена' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;