import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Button, Alert, Spinner, Form } from 'react-bootstrap';
import { FaDoorOpen, FaDoorClosed, FaQuestionCircle } from 'react-icons/fa';

const Users = ({ eventId, refreshUsers }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/event/${eventId}/users`);
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        setErrorMessage('Error al cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    setErrorMessage('');
    setSuccessMessage('');
  }, [eventId, refreshUsers]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter((user) =>
        (user.nombre?.toLowerCase() || '').includes(query.toLowerCase()) ||
        (user.rol?.toLowerCase() || '').includes(query.toLowerCase()) ||
        (user.DNI ? String(user.DNI).includes(query) : false) // Convertir DNI a string antes de comparar
      );
      setFilteredUsers(filtered.length > 0 ? filtered : []);
    }
  };

  const handleLog = (userId, estado) => {
    axios.post(`http://localhost:5000/api/log/${eventId}`, { userId, estado })
      .then(response => {
        if (response.data) {
          setSuccessMessage(response.data.message);
          setErrorMessage('');

          const updatedUsers = users.map(user => {
            if (user.id_usuario === userId) {
              user.last_log = estado;
              user.cantidad_ingresos = response.data.cantidad_ingresos;
            }
            return user;
          });

          setUsers(updatedUsers);
          setFilteredUsers(updatedUsers);

          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        }
      })
      .catch(err => {
        setErrorMessage(err.response?.data?.message || 'Error desconocido');
        setSuccessMessage('');

        setTimeout(() => {
          setErrorMessage('');
        }, 3000);
      });
  };

  const getUserStatus = (userId) => {
    const lastLog = users.find(user => user.id_usuario === userId)?.last_log;
    if (lastLog === undefined || lastLog === null) {
      return <FaQuestionCircle color="gray" title="Desconocido" />;
    }
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

      <Form.Control
        type="text"
        placeholder="Buscar usuario, rol o DNI..."
        value={searchQuery}
        onChange={handleSearch}
        className="mb-3"
      />

      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {filteredUsers.length > 0 ? (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Cantidad de Ingresos</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id_usuario} style={{ backgroundColor: searchQuery && (user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || user.rol.toLowerCase().includes(searchQuery.toLowerCase()) || user.DNI.toLowerCase().includes(searchQuery.toLowerCase())) ? '#ffff99' : 'transparent' }}>
                <td>{user.nombre}</td>
                <td>{user.DNI}</td>
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
      ) : (
        <Alert variant="warning">No existe la persona</Alert>
      )}
    </div>
  );
};

export default Users;
