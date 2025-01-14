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

// Ruta para validar el DNI y registrar la entrada/salida del invitado
app.post('/api/scanner/:eventId', (req, res) => {
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

            const lastLogQuery = `
                SELECT estado
                FROM logs
                WHERE id_usuario = ? AND id_evento = ?
                ORDER BY id_logs DESC LIMIT 1
            `;

            db.query(lastLogQuery, [user.id_usuario, eventId], (logErr, logResults) => {
                if (logErr) {
                    console.error('Error al consultar último log:', logErr.message);
                    return res.status(500).json({ message: 'Error al consultar el estado de acceso' });
                }

                let estado = 1; // Por defecto, entrada
                if (logResults.length > 0 && logResults[0].estado === 1) {
                    estado = 0; // Cambiar a salida
                }

                const insertLogQuery = `
                    INSERT INTO logs (id_usuario, id_evento, fecha, estado)
                    VALUES (?, ?, NOW(), ?)
                `;

                db.query(insertLogQuery, [user.id_usuario, eventId, estado], (insertErr) => {
                    if (insertErr) {
                        console.error('Error al insertar en logs:', insertErr.message);
                        return res.status(500).json({ message: 'Error al guardar el log' });
                    }

                    const tipo = estado === 1 ? 'Entrada' : 'Salida';

                    res.status(200).json({
                        message: `Acceso ${tipo} registrado exitosamente.`,
                    });
                });
            });
        } else {
            console.log(`Usuario con DNI ${dni} no encontrado para el evento ${eventId}`);
            return res.status(404).json({ message: 'Usuario no encontrado para este evento' });
        }
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

// Ruta para obtener los logs de un evento específico
app.get('/api/events/:eventId/logs', (req, res) => {
    const eventId = req.params.eventId;

    if (!eventId) {
        return res.status(400).json({ message: 'ID de evento es requerido' });
    }

    const query = `
        SELECT logs.id_logs, logs.fecha, logs.estado, usuario.nombre AS usuario
        FROM logs
        JOIN usuario ON logs.id_usuario = usuario.id_usuario
        WHERE logs.id_evento = ?
        ORDER BY logs.fecha DESC
    `;

    db.query(query, [eventId], (err, results) => {
        if (err) {
            console.error('Error al obtener los registros:', err.message);
            return res.status(500).json({ message: 'Error en la base de datos' });
        }

        if (results.length === 0) {
            // Si no hay registros, devolvemos una respuesta con código 200 y un arreglo vacío
            return res.status(200).json([]);  // Retorna un arreglo vacío en lugar de un 404
        }

        res.json(results);  // Si hay registros, los devuelve normalmente
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
