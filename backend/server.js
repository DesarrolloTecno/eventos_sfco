const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

// Configuración de CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? 'https://tudominio.com' : 'http://localhost:3000',
    methods: ['POST', 'GET'],
    allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json()); // Uso de body-parser para manejar solicitudes JSON

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Eventos_sanfco',
    database: process.env.DB_NAME || 'eventos',
});

// Conexión a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err.message);
        return;
    }
    console.log('Conexión exitosa a MySQL');
});

// Ruta para iniciar sesión
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const query = 'SELECT * FROM admin WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error en la consulta de base de datos:', err.message);
            return res.status(500).json({ message: 'Error en la base de datos' });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'Email o password incorrectos' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error al comparar password:', err.message);
                return res.status(500).json({ message: 'Error al verificar la contraseña' });
            }

            if (!isMatch) {
                return res.status(400).json({ message: 'Email o password incorrectos' });
            }

            res.json({
                message: 'Inicio de sesión exitoso',
                user: {
                    id: user.id_admin,
                    email: user.email,
                    username: user.username,
                },
            });
        });
    });
});

// Ruta para validar el DNI de un usuario en un evento
app.post('/api/validate/:eventId', (req, res) => {
    const { eventId } = req.params;
    const { dni } = req.body;

    if (!dni || !eventId) {
        return res.status(400).json({ message: 'DNI y evento son requeridos' });
    }

    const userQuery = `
        SELECT usuario.id_usuario, usuario.nombre AS usuario, rol.nombre AS rol, rol.color AS color
        FROM usuario
        JOIN usuario_rol ON usuario.id_usuario = usuario_rol.id_usuario
        JOIN rol ON usuario_rol.id_rol = rol.id_rol
        JOIN usuario_evento ON usuario.id_usuario = usuario_evento.id_usuario
        WHERE usuario.DNI = ? AND usuario_evento.id_evento = ?
    `;

    db.query(userQuery, [dni, eventId], (err, results) => {
        if (err) {
            console.error('Error en la consulta de base de datos:', err.message);
            return res.status(500).json({ message: 'Error en la base de datos' });
        }

        if (results.length > 0) {
            const user = results[0];
            res.status(200).json({ match: true, user });
        } else {
            console.log(`Usuario con DNI ${dni} no encontrado para el evento ${eventId}`);
            return res.status(404).json({ match: false, message: 'Usuario no encontrado para este evento' });
        }
    });
});

// Ruta para registrar entrada/salida
// Variable para evitar solicitudes duplicadas
let lastRequestTime = {};

app.post('/api/log/:eventId', (req, res) => {
    const { eventId } = req.params;
    const { userId, estado } = req.body;

    const currentTime = Date.now();
    const userKey = `${userId}-${eventId}`;

    lastRequestTime[userKey] = currentTime;

    if (!userId || !eventId || typeof estado === 'undefined') {
        console.error('Faltan datos requeridos:', { eventId, userId, estado });
        return res.status(400).json({
            message: 'Usuario, evento y estado son requeridos',
            data: { eventId, userId, estado }
        });
    }

    // Consulta para verificar si ya existe un registro en la misma fecha y hora o dentro de ±1 minuto
    const checkLogQuery = `
        SELECT COUNT(*) AS count, MAX(fecha) AS last_fecha
        FROM logs
        WHERE id_usuario = ? AND id_evento = ? AND estado = ?
    `;

    db.query(checkLogQuery, [userId, eventId, estado], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error al verificar duplicados en logs:', checkErr.message);
            return res.status(500).json({ message: 'Error al verificar duplicados', error: checkErr.message });
        }

        const lastFecha = checkResult[0].last_fecha;

        if (checkResult[0].count > 0) {
            const currentDate = new Date();
            const lastDate = new Date(lastFecha);
            const diffInMs = currentDate - lastDate; // Diferencia en milisegundos
            const diffInMinutes = diffInMs / (1000 * 60); // Convertir a minutos

            if (diffInMinutes <= 1) {
                console.log(`Registro duplicado: El usuario ${userId} ya tiene un acceso registrado en la misma fecha y hora (±1 minuto).`);
                return res.status(400).json({
                    message: 'Ya existe un registro para este usuario en la misma fecha y hora dentro de 1 minuto. Por favor aguarde un minuto',
                    data: { eventId, userId, estado }
                });
            }
        }

        // Si no hay duplicados o la diferencia es mayor a 1 minuto, procedemos a insertar el nuevo registro
        const insertLogQuery = `
            INSERT INTO logs (id_usuario, id_evento, fecha, estado)
            VALUES (?, ?, NOW(), ?)
        `;

        db.query(insertLogQuery, [userId, eventId, estado], (insertErr) => {
            if (insertErr) {
                console.error('Error al insertar en logs:', insertErr.message);
                return res.status(500).json({ message: 'Error al guardar el log', error: insertErr.message });
            }

            const tipo = estado === 1 ? 'Entrada' : 'Salida'; // Determinar el tipo de registro
            console.log(`Registro exitoso: ${tipo} para el usuario ${userId} en el evento ${eventId}`);

            res.status(200).json({
                message: `Acceso ${tipo} registrado exitosamente.`,
                data: { eventId, userId, estado }
            });
        });
    });
});


// Ruta para obtener todos los eventos
app.get('/api/events', (req, res) => {
    const query = 'SELECT id_evento AS id, nombre AS nombre FROM evento';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener eventos:', err.message);
            return res.status(500).json({ message: 'Error en la base de datos' });
        }
        res.json(results);
    });
});

// Ruta para obtener el nombre de un evento específico por ID
app.get('/api/events/:id', (req, res) => {
    const eventId = req.params.id;

    if (!eventId) {
        return res.status(400).json({ message: 'ID de evento es requerido' });
    }

    const query = 'SELECT nombre FROM evento WHERE id_evento = ?';
    db.query(query, [eventId], (err, results) => {
        if (err) {
            console.error('Error al obtener el nombre del evento:', err.message);
            return res.status(500).json({ message: 'Error en la base de datos' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        res.json({ nombre: results[0].nombre });
    });
});

app.get('/api/events/:eventId/logs', (req, res) => {
    const { eventId } = req.params;
    const { date, estado, usuario } = req.query;

    if (!eventId) {
        return res.status(400).json({ message: 'ID de evento es requerido' });
    }

    let query = `
        SELECT logs.id_logs, logs.fecha, logs.estado, usuario.nombre AS usuario
        FROM logs
        JOIN usuario ON logs.id_usuario = usuario.id_usuario
        WHERE logs.id_evento = ?
    `;

    let queryParams = [eventId];

    if (date) {
        query += " AND DATE(logs.fecha) = ?";
        queryParams.push(date);
    }

    if (estado) {
        query += " AND logs.estado = ?";
        queryParams.push(parseInt(estado, 10)); // Convertir a número
    }

    if (usuario) {
        query += " AND usuario.nombre LIKE ?";
        queryParams.push(`%${usuario}%`); // Búsqueda parcial
    }

    query += " ORDER BY logs.fecha DESC";

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error al obtener los registros:', err.message);
            return res.status(500).json({ message: 'Error en la base de datos' });
        }

        res.json(results);
    });
});

// Ruta para obtener todos los usuarios de un evento
app.get('/api/event/:eventId/users', (req, res) => {
    const { eventId } = req.params;

    if (!eventId) {
        return res.status(400).json({ message: 'ID de evento es requerido' });
    }

    const query = `
        SELECT usuario.id_usuario, usuario.nombre, usuario.DNI, rol.nombre AS rol, rol.color
        FROM usuario
        JOIN usuario_evento ON usuario.id_usuario = usuario_evento.id_usuario
        JOIN usuario_rol ON usuario_rol.id_usuario = usuario_evento.id_usuario
        JOIN rol ON usuario_rol.id_rol = rol.id_rol
        WHERE usuario_evento.id_evento = ?
    `;

    db.query(query, [eventId], (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err.message);
            return res.status(500).json({ message: 'Error en la base de datos' });
        }

        res.json(results);
    });
});


// Ruta para registrar entrada/salida
app.post('/api/log/:eventId', (req, res) => {
    const { eventId } = req.params;
    const { userId, estado } = req.body;

    const currentTime = Date.now();
    const userKey = `${userId}-${eventId}`;

    lastRequestTime[userKey] = currentTime;

    if (!userId || !eventId || typeof estado === 'undefined') {
        console.error('Faltan datos requeridos:', { eventId, userId, estado });
        return res.status(400).json({
            message: 'Usuario, evento y estado son requeridos',
            data: { eventId, userId, estado }
        });
    }

    // Verificar si ya existe un log para este usuario en el mismo evento
    const checkLogQuery = `
        SELECT COUNT(*) AS count, MAX(fecha) AS last_fecha
        FROM logs
        WHERE id_usuario = ? AND id_evento = ? AND estado = ?
    `;

    db.query(checkLogQuery, [userId, eventId, estado], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error al verificar duplicados en logs:', checkErr.message);
            return res.status(500).json({ message: 'Error al verificar duplicados', error: checkErr.message });
        }

        const lastFecha = checkResult[0].last_fecha;

        if (checkResult[0].count > 0) {
            const currentDate = new Date();
            const lastDate = new Date(lastFecha);
            const diffInMs = currentDate - lastDate; // Diferencia en milisegundos
            const diffInMinutes = diffInMs / (1000 * 60); // Convertir a minutos

            if (diffInMinutes <= 1) {
                console.log(`Registro duplicado: El usuario ${userId} ya tiene un acceso registrado en la misma fecha y hora (±1 minuto).`);
                return res.status(400).json({
                    message: 'Ya existe un registro para este usuario en la misma fecha y hora dentro de 1 minuto. Por favor aguarde un minuto',
                    data: { eventId, userId, estado }
                });
            }
        }

        // Si no hay duplicados, insertar el nuevo log
        const insertLogQuery = `
            INSERT INTO logs (id_usuario, id_evento, fecha, estado)
            VALUES (?, ?, NOW(), ?)
        `;

        db.query(insertLogQuery, [userId, eventId, estado], (insertErr) => {
            if (insertErr) {
                console.error('Error al insertar en logs:', insertErr.message);
                return res.status(500).json({ message: 'Error al guardar el log', error: insertErr.message });
            }

            const tipo = estado === 1 ? 'Entrada' : 'Salida'; // Determinar tipo de registro
            console.log(`Registro exitoso: ${tipo} para el usuario ${userId} en el evento ${eventId}`);

            res.status(200).json({
                message: `Acceso ${tipo} registrado exitosamente.`,
                data: { eventId, userId, estado }
            });
        });
    });
});



// Configuración para producción
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
    });
}

// Inicio del servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
