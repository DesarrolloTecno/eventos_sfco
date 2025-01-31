import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Button, Alert, Spinner } from 'react-bootstrap';

const Users = ({ eventId }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Fetch de los usuarios del evento
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`/api/event/${eventId}/users`); // Endpoint correcto en el backend
                setUsers(response.data);
            } catch (error) {
                setErrorMessage('Error al cargar los usuarios');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [eventId]);

    // Función para manejar la entrada/salida
    const handleLog = (userId, estado) => {
        axios.post(`/api/log/${eventId}`, { userId, estado })
            .then(response => alert(response.data.message)) // Muestra un mensaje de éxito
            .catch(err => console.error('Error al registrar entrada/salida:', err));
    };

    if (loading) {
        return (
            <div className="text-center">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    if (errorMessage) {
        return <Alert variant="danger">{errorMessage}</Alert>;
    }

    return (
        <div>
            <h3>Lista de Usuarios</h3>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Rol</th>
                        <th>Acci&oacute;n</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id_usuario}>
                            <td>{user.nombre}</td>
                            <td>{user.rol}</td>
                            <td>
                                <Button variant="success" onClick={() => handleLog(user.id_usuario, 1)}>Entrada</Button>
                                <Button variant="danger" onClick={() => handleLog(user.id_usuario, 0)}>Salida</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default Users;
