import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css'; // Aseg�rate de tener los estilos de bootstrap cargados

function LoginModal({ isOpen, closeModal, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Si el modal no est� abierto, no se renderiza
    if (!isOpen) return null;

    // Manejar el env�o del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Llamada a la API de inicio de sesi�n
        try {
            const response = await fetch('https://eventback-f6aiwsqjia-uc.a.run.app/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Manejar inicio de sesi�n exitoso
                console.log('Login exitoso', data);
                onLoginSuccess(data.user); // Pasa los datos del usuario al contexto
                closeModal(); // Cerramos el modal
                setEmail(''); // Limpiar el campo email
                setPassword(''); // Limpiar el campo password
                setError(''); // Limpiar posibles errores
            } else {
                // Mostrar error
                setError(data.message || 'Hubo un error en el inicio de sesi�n');
            }
        } catch (err) {
            console.error('Error en la solicitud:', err);
            setError('Error en la conexi�n');
        }
    };

    // Limpiar los campos cuando se cierra el modal sin hacer login
    const handleCloseModal = () => {
        closeModal();
        setEmail(''); // Limpiar el email
        setPassword(''); // Limpiar la contrase�a
        setError(''); // Limpiar el error
    };

    return (
        <Modal show={isOpen} onHide={handleCloseModal} centered>
            <Modal.Header closeButton>
                <Modal.Title>Iniciar Sesi&oacute;n</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="email">
                        <Form.Label>Correo Electr&oacute;nico</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Ingrese su correo"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="password">
                        <Form.Label>Contrase&ntilde;a</Form.Label>
                        <Form.Control
                            type="password"
                            placeholder="Ingrese su contrase&ntilde;a"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </Form.Group>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Button variant="primary" type="submit" className="w-100">
                        Iniciar Sesi&oacute;n
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default LoginModal;
