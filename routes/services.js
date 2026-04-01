const router = require('express').Router();
const Service = require('../models/Service');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Создаём папку для загрузок
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// ПОЛУЧИТЬ ВСЕ УСЛУГИ
router.get('/', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ПОЛУЧИТЬ ОДНУ УСЛУГУ ПО ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// СОЗДАТЬ НОВУЮ УСЛУГУ
router.post('/', async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ОБНОВИТЬ УСЛУГУ
router.put('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }
    res.json(service);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// УДАЛИТЬ УСЛУГУ
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }
    res.json({ message: 'Услуга удалена' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ИМПОРТ ИЗ EXCEL
router.post('/import-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    console.log('Файл загружен:', req.file.path);

    // Читаем Excel файл
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log('Найдено строк:', data.length);

    const services = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Определяем название услуги (поддерживаем разные варианты заголовков)
      const name = row['Услуга'] || row['Название'] || row['name'];
      const price = row['Цена'] || row['price'];
      const category = row['Категория'] || row['category'] || 'Шиномонтаж';
      
      if (!name || !price) {
        errors.push(`Строка ${i + 2}: отсутствует название или цена`);
        continue;
      }

      // Определяем тип авто
      let carType = 'passenger';
      const typeStr = (row['Тип авто'] || row['carType'] || category).toString().toLowerCase();
      
      if (typeStr.includes('кросс') || typeStr.includes('suv') || typeStr.includes('внедорож')) {
        carType = 'suv';
      } else if (typeStr.includes('груз') || typeStr.includes('truck')) {
        carType = 'truck';
      }

      services.push({
        name: name.toString().trim(),
        category: category.toString().trim(),
        price: parseFloat(price),
        carType: carType
      });
    }

    // Удаляем временный файл
    fs.unlinkSync(req.file.path);

    if (errors.length > 0) {
      return res.status(400).json({ errors, services: [] });
    }

    // Сохраняем услуги в базу
    const Service = require('../models/Service');
    const result = await Service.insertMany(services);
    
    res.json({ 
      message: `Импортировано ${result.length} услуг`,
      services: result 
    });

  } catch (err) {
    console.error('Ошибка импорта:', err);
    // Удаляем временный файл в случае ошибки
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;