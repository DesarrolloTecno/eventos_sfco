import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Button, Alert, Spinner, Form } from 'react-bootstrap';
import { FaDoorOpen, FaDoorClosed, FaQuestionCircle } from 'react-icons/fa';

const Users = ({ eventId }) => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Fetch de los usuarios del evento
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`/api/event/${eventId}/users`);
                setUsers(response.data);
                setFilteredUsers(response.data);
            } catch (error) {
                setErrorMessage('Error al cargar los usuarios');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [eventId]);

    // Filtrar usuarios por el texto de búsqueda
    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query === '') {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter((user) =>
                user.nombre.toLowerCase().includes(query.toLowerCase()) || user.rol.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    };

    // Función para manejar la entrada/salida
    const handleLog = (userId, estado) => {
      axios.post(`/api/log/${eventId}`, { userId, estado })
        .then(response => {
          if (response.data) {
            setSuccessMessage(response.data.message); // Mensaje de éxito
            setErrorMessage(''); // Limpiar mensaje de error si es exitoso

            // Actualizar el estado del usuario en la lista
            const updatedUsers = users.map(user => {
              if (user.id_usuario === userId) {
                user.last_log = estado; // Actualizar el estado del usuario
                user.cantidad_ingresos = response.data.cantidad_ingresos; // Actualizar la cantidad de ingresos
              }
              return user;
            });

            setUsers(updatedUsers); // Actualizar la lista de usuarios
            setFilteredUsers(updatedUsers); // También actualizar la lista filtrada

            // Limpiar el mensaje de éxito después de 5 segundos
            setTimeout(() => {
              setSuccessMessage('');
            }, 3000);
          }
        })
        .catch(err => {
          setErrorMessage(err.response?.data?.message || 'Error desconocido');
          setSuccessMessage(''); // Limpiar mensaje de éxito si es error

          // Limpiar el mensaje de error después de 5 segundos
          setTimeout(() => {
            setErrorMessage('');
          }, 3000);
        });
    };


    // Función para obtener el estado de cada usuario
    const getUserStatus = (userId) => {
        const lastLog = users.find(user => user.id_usuario === userId)?.last_log;

        // Si no hay último registro, se considera "desconocido"
        if (lastLog === undefined || lastLog === null) {
            return <FaQuestionCircle color="gray" title="Desconocido" />;
        }

        // Verificar si el último estado es 'entrada' (1) o 'salida' (0)
        return lastLog === 1
            ? <FaDoorOpen color="green" title="Adentro" />
            : <FaDoorClosed color="red" title="Afuera" />;
    };

    if (loading) {
        return (
            <div className="text-center">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div>
            <h3>Lista de Usuarios</h3>

            {/* Campo de búsqueda */}
            <Form.Control
                type="text"
                placeholder="Buscar usuario o rol..."
                value={searchQuery}
                onChange={handleSearch}
                className="mb-3"
            />

            {/* Mostrar mensajes de éxito o error */}
            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Cantidad de Ingresos</th>
                        <th>Acci&oacute;n</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map((user) => (
                        <tr key={user.id_usuario}>
                            <td>{user.nombre}</td>
                            <td>{user.rol}</td>
                            <td>{getUserStatus(user.id_usuario)}</td>
                            <td>{user.cantidad_ingresos}</td>
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
