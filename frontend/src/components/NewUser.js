import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import axios from 'axios';

function NewUser() {
  const [userData, setUserData] = useState({
    dni: '',
    nombre: '',
    rol: '',
    eventoId: ''
  });
  const [roles, setRoles] = useState([]);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Obtener roles
    axios.get('http://localhost:5000/api/roles')
      .then(response => setRoles(response.data))
      .catch(err => setError('Error al obtener roles'));

    // Obtener eventos
    axios.get('http://localhost:5000/api/events')
      .then(response => setEvents(response.data))
      .catch(err => setError('Error al obtener eventos'));
  }, []);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/users', userData);
      setMessage(response.data.message);
      setUserData({ dni: '', nombre: '', rol: '', eventoId: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar usuario');
    }
  };

  return (
    <Container className="mt-5">
      <h2>Agregar Nuevo Usuario</h2>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Form.Group>
        <Form.Label>Evento</Form.Label>
        <Form.Control
          as="select"
          name="eventoId"
          value={userData.eventoId}
          onChange={handleChange}
          required
        >
          <option value="">Selecciona un evento</option>
          {events.map((event, index) => (
            <option key={index} value={event.id_evento}>{event.nombre}</option>
          ))}
        </Form.Control>
      </Form.Group>


      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>DNI</Form.Label>
          <Form.Control
            type="text"
            name="dni"
            value={userData.dni}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Nombre</Form.Label>
          <Form.Control
            type="text"
            name="nombre"
            value={userData.nombre}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Rol</Form.Label>
          <Form.Control
            as="select"
            name="rol"
            value={userData.rol}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona un rol</option>
            {roles.map((role, index) => (
              <option key={index} value={role}>{role}</option>
            ))}
          </Form.Control>
        </Form.Group>

        

        <Button variant="primary" type="submit" className="mt-3">Agregar Usuario</Button>
      </Form>
    </Container>
  );
}

export default NewUser;
