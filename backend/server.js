const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000; // Puerto dinámico para producción

// Configurar CORS para producción
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? 'https://tudominio.com' : 'http://localhost:3000', // Cambia a tu dominio en producción
    methods: ['POST', 'GET'],
    allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions)); // Middleware para CORS

app.use(express.json()); // Middleware para parsear JSON en las solicitudes

// Conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Eventos_sanfco',
    database: process.env.DB_NAME || 'eventos',
});

// Verificar conexión a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err.message);
        return;
    }
    console.log('Conexión exitosa a MySQL');
});

// Ruta para consultar el DNI
app.post('/api/validate-dni', (req, res) => {
    const { dni, eventId } = req.body;

    console.log('Solicitud recibida en /api/validate-dni:', req.body); // Log del cuerpo de la solicitud

    if (!dni || !eventId) {
        console.error('Faltan parámetros: dni o eventId');
        return res.status(400).json({ message: 'DNI y Evento son requeridos' });
    }

    const query = `
        SELECT usuario.nombre AS usuario, rol.nombre AS rol, rol.color AS color
        FROM usuario
        JOIN usuario_rol ON usuario.id_usuario = usuario_rol.id_usuario
        JOIN rol ON usuario_rol.id_rol = rol.id_rol
        JOIN usuario_evento ON usuario.id_usuario = usuario_evento.id_usuario
        WHERE usuario.DNI = ? AND usuario_evento.id_evento = ?`;

    db.query(query, [dni, eventId], (err, results) => {
        if (err) {
            console.error('Error en la consulta de base de datos:', err.message);
            return res.status(500).json({ message: 'Error en la base de datos' });
        }

        console.log('Resultados de la consulta:', results); // Log de resultados de la consulta

        if (results.length > 0) {
            const user = results[0];
            res.json({ match: true, user });
        } else {
            res.json({ match: false });
        }
    });
});

// Ruta principal para comprobar que el servidor está activo
app.get('/', (req, res) => {
    res.send('Servidor Backend corriendo correctamente');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});

app.get('/api/events', (req, res) => {
    const query = 'SELECT id_evento AS id, nombre AS nombre FROM evento';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching events:', err.message);
            return res.status(500).json({ message: 'Error en la base de datos' });
        }
        res.json(results);
    });
});

const path = require('path');

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
    });
}

