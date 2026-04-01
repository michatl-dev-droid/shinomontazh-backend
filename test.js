const http = require('http');

const server = http.createServer((req, res) => {
    console.log('📡 Получен запрос на ' + req.url);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ 
        message: 'Тестовый сервер работает!', 
        time: new Date().toLocaleString('ru-RU') 
    }));
});

server.listen(5000, () => {
    console.log('=================================');
    console.log('✅ ТЕСТОВЫЙ СЕРВЕР ЗАПУЩЕН!');
    console.log('🌐 http://localhost:5000');
    console.log('=================================');
    console.log('Нажмите Ctrl+C для остановки');
});