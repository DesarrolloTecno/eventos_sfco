import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Logs = ({ eventId }) => {
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState('');

    // Función para formatear la fecha
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        if (eventId) {
            axios.get(`http://localhost:3000/api/events/${eventId}/logs`)
                .then(response => {
                    if (response.data.length === 0) {
                        setError('No se encontraron registros para este evento.');
                    } else {
                        setLogs(response.data);
                    }
                })
                .catch(err => {
                    console.error('Error al obtener los registros:', err);
                    setError('Error al obtener los registros');
                });
        } else {
            setError('Evento no válido');
        }
    }, [eventId]);

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h2>Registros</h2>
            {logs.length === 0 ? (
                <p>No hay registros para este evento.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Usuario</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id_logs}>
                                <td>{formatDate(log.fecha)}</td>
                                <td>{log.estado === 1 ? "Ingreso" : "Egreso"}</td>
                                <td>{log.usuario}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Logs;
