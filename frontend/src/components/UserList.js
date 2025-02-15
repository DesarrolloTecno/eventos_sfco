import React, { useState, useEffect } from 'react';
import { Table, Button, Container, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

function UserList() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Obtener la lista de usuarios desde el backend
  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      setUsers(response.data);
    } catch (err) {
      setError('Error al obtener usuarios');
    }
  };

  // Eliminar un usuario
  const handleDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${userId}`);
        setMessage('Usuario eliminado correctamente');
        fetchUsers(); // Recargar la lista
      } catch (err) {
        setError('Error al eliminar usuario');
      }
    }
  };

  return (
    <Container className="mt-5">
      <h2>Lista de Usuarios</h2>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Link to="/new-user">
        <Button variant="success" className="mb-3">➕ Agregar Usuario</Button>
      </Link>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>DNI</th>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id_usuario}>
              <td>{user.id_usuario}</td>
              <td>{user.DNI}</td>
              <td>{user.nombre}</td>
              <td>
                <Link to={`/edit-user/${user.id_usuario}`}>
                  <Button variant="warning" size="sm" className="me-2">✏️ Editar</Button>
                </Link>
                <Button variant="danger" size="sm" onClick={() => handleDelete(user.id_usuario)}>🗑️ Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default UserList;
