require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Configuración de CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? 'https://tudominio.com' : 'http://localhost:3000',
    methods: ['POST', 'GET'],
    allowedHeaders: ['Content-Type'],
};

app.use(cors());
app.use(express.json());

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST || '35.239.110.211',
    user: process.env.DB_USER || 'eventos',
    password: process.env.DB_PASSWORD || '2024Eventos',
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

// Validar usuario por DNI y evento
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
        WHERE usuario.DNI = ? AND usuario_evento.id_evento = ?`;

    db.query(userQuery, [dni, eventId], (err, results) => {
        if (err) {
            console.error('Error en la consulta de base de datos:', err.message);
            return res.status(500).json({ message: 'Error en la base de datos' });
        }

        if (results.length > 0) {
            return res.status(200).json({ match: true, user: results[0] });
        } else {
            return res.status(404).json({ match: false, message: 'Usuario no encontrado para este evento' });
        }
    });
});

// Ruta para obtener todos los eventos
app.get('/api/events', (req, res) => {
    const query = 'SELECT id_evento AS id, nombre AS nombre FROM evento';
    db.query(query, (err, results) => {
        if (err) {
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
            return res.status(500).json({ message: 'Error en la base de datos' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }

        res.json({ nombre: results[0].nombre });
    });
});

// Obtener usuarios del evento, con la cantidad de ingresos calculada
app.get('/api/event/:eventId/users', (req, res) => {
    const { eventId } = req.params;

    if (!eventId) {
        return res.status(400).json({ message: 'ID de evento es requerido' });
    }

    const query = `
        SELECT usuario.id_usuario, usuario.nombre, usuario.DNI, 
               rol.nombre AS rol, rol.color, 
               -- Subconsulta para obtener el último estado
               (SELECT logs.estado 
                FROM logs 
                WHERE logs.id_usuario = usuario.id_usuario 
                ORDER BY logs.fecha DESC LIMIT 1) AS last_log,
               -- Calcular la cantidad de ingresos
               COUNT(CASE WHEN logs.estado = 1 THEN 1 END) AS cantidad_ingresos
        FROM usuario
        JOIN usuario_evento ON usuario.id_usuario = usuario_evento.id_usuario
        JOIN usuario_rol ON usuario_rol.id_usuario = usuario_evento.id_usuario
        JOIN rol ON usuario_rol.id_rol = rol.id_rol
        LEFT JOIN logs ON logs.id_usuario = usuario.id_usuario 
                      AND logs.id_evento = ?
        WHERE usuario_evento.id_evento = ?
        GROUP BY usuario.id_usuario, usuario.nombre, usuario.DNI, rol.nombre, rol.color
    `;

    db.query(query, [eventId, eventId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error en la base de datos' });
        }

        res.json(results);
    });
});


// Registrar acceso en logs
app.post('/api/log/:eventId', (req, res) => {
    const { eventId } = req.params;
    const { userId, estado } = req.body;

    if (!userId || !eventId || typeof estado === 'undefined') {
        return res.status(400).json({ message: 'Usuario, evento y estado son requeridos' });
    }

    // Verificar el último estado registrado
    const checkLastStateQuery = `
        SELECT estado FROM logs
        WHERE id_usuario = ? AND id_evento = ?
        ORDER BY fecha DESC LIMIT 1`;

    db.query(checkLastStateQuery, [userId, eventId], (checkErr, results) => {
        if (checkErr) {
            console.error('Error al verificar el estado anterior:', checkErr);
            return res.status(500).json({ message: 'Error al consultar el estado anterior' });
        }

        if (results.length === 0) {
            insertLog();
        } else {
            const lastState = results[0].estado;

            // Validar si el último estado es igual al nuevo estado
            if (lastState === estado) {
                return res.status(400).json({
                    message: `No puedes registrar dos ${estado === 1 ? 'entradas' : 'salidas'} consecutivas.`,
                });
            }

            insertLog();
        }
    });

    function insertLog() {
        const insertLogQuery = `
        INSERT INTO logs (id_usuario, id_evento, fecha, estado)
        VALUES (?, ?, NOW(), ?)`;

        db.query(insertLogQuery, [userId, eventId, estado], (insertErr) => {
            if (insertErr) {
                console.error('Error al insertar el log:', insertErr);
                return res.status(500).json({ message: 'Error al guardar el log' });
            }

            // Obtener la cantidad actualizada de ingresos
            const countIngresosQuery = `
            SELECT COUNT(*) AS cantidad_ingresos 
            FROM logs 
            WHERE id_usuario = ? AND id_evento = ? AND estado = 1`;

            db.query(countIngresosQuery, [userId, eventId], (countErr, countResult) => {
                if (countErr) {
                    console.error('Error al obtener la cantidad de ingresos:', countErr);
                    return res.status(500).json({ message: 'Error al obtener la cantidad de ingresos' });
                }

                const cantidadIngresos = countResult[0].cantidad_ingresos;

                res.status(200).json({
                    message: `Acceso ${estado === 1 ? 'Entrada' : 'Salida'} registrado exitosamente.`,
                    cantidad_ingresos: cantidadIngresos, // Enviar la cantidad actualizada
                });
            });
        });
    }
});




// Ruta para obtener los logs de un evento
app.get('/api/events/:eventId/logs', (req, res) => {
    const { eventId } = req.params;
    const { date, estado, usuario, rol } = req.query;  // Recibimos los filtros desde los parámetros de la consulta

    let query = `
        SELECT logs.id_logs, logs.fecha, logs.estado, usuario.nombre AS usuario, rol.nombre
        FROM logs
        JOIN usuario ON logs.id_usuario = usuario.id_usuario
        JOIN usuario_rol ON usuario.id_usuario = usuario_rol.id_usuario
        JOIN rol ON usuario_rol.id_rol = rol.id_rol
        WHERE logs.id_evento = ?
    `;

    // Crear filtros dinámicos
    let queryParams = [eventId];

    if (date) {
        query += ' AND DATE(logs.fecha) = ?';
        queryParams.push(date);
    }

    if (estado !== undefined) {
        query += ' AND logs.estado = ?';
        queryParams.push(estado);
    }

    if (usuario) {
        query += ' AND usuario.nombre LIKE ?';
        queryParams.push(`%${usuario}%`);
    }

    if (rol) {
        query += ' AND rol.nombre LIKE ?';
        queryParams.push(`%${rol}%`);
    }

    query += ' ORDER BY logs.fecha DESC';

    // Ejecutar la consulta con los parámetros dinámicos
    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error al obtener logs:', err);
            return res.status(500).json({ message: 'Error al obtener logs' });
        }

        // Enviar los resultados sin duplicados
        const uniqueResults = results.filter((value, index, self) =>
            index === self.findIndex((t) => (
                t.id_logs === value.id_logs
            ))
        );

        res.json(uniqueResults);
    });
});


// Ruta para obtener todos los roles
app.get('/api/roles', (req, res) => {
    const query = 'SELECT nombre FROM rol';  // Asegúrate de que el nombre de la columna sea correcto

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener roles:', err);
            return res.status(500).json({ message: 'Error al obtener roles' });
        }

        // Si todo sale bien, devolvemos los resultados (los nombres de los roles)
        res.json(results.map(role => role.nombre));  // Mapeamos los resultados para devolver solo los nombres
    });
});



//ADMIN **********************************************************************


// Obtener todos los usuarios
app.get('/api/users', (req, res) => {
    const query = 'SELECT * FROM usuario';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }
        res.json(results);
    });
});


// Agregar Usuario
app.post('/api/users', (req, res) => {
    const { dni, apellido, nombre, rol, eventoId } = req.body;

    if (!dni || !nombre || !rol || !eventoId) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Iniciar la transacción
    const queryUser = 'INSERT INTO usuario (DNI, nombre) VALUES (?, ?)';
    const queryRole = 'INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?, ?)';
    const queryEvent = 'INSERT INTO usuario_evento (id_usuario, id_evento) VALUES (?, ?)';

    db.beginTransaction((err) => {
        if (err) {
            console.error('Error al iniciar la transacción:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        // Insertar el usuario
        db.query(queryUser, [dni, nombre, apellido], (err, userResult) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error al insertar el usuario:', err);
                    res.status(500).json({ error: 'Error en el servidor' });
                });
            }

            const userId = userResult.insertId;

            // Insertar el rol
            db.query(queryRole, [userId, rol], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error al insertar el rol:', err);
                        res.status(500).json({ error: 'Error en el servidor' });
                    });
                }

                // Insertar el evento
                db.query(queryEvent, [userId, eventoId], (err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error al insertar el evento:', err);
                            res.status(500).json({ error: 'Error en el servidor' });
                        });
                    }

                    // Confirmar la transacción
                    db.commit((err) => {
                        if (err) {
                            return db.rollback(() => {
                                console.error('Error al confirmar la transacción:', err);
                                res.status(500).json({ error: 'Error en el servidor' });
                            });
                        }

                        res.json({ message: 'Usuario, rol y evento agregados exitosamente' });
                    });
                });
            });
        });
    });
});


// Eliminar usuario
app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM usuario WHERE id_usuario = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar usuario:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario eliminado correctamente' });
    });
});


// Configuración para producción
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'client', 'build', 'index.html')));
}

// Inicio del servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});
