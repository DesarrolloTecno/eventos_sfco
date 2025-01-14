import React, { useState } from 'react';
import '../styles/LoginModal.css'; // Estilos para el modal

function LoginModal({ isOpen, closeModal, onLoginSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null; // Si no está abierto, no se renderiza el modal

    // Manejar el envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Llamada a la API de inicio de sesión
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Manejar inicio de sesión exitoso
                console.log('Login exitoso', data);
                onLoginSuccess(data.user); // Pasa los datos del usuario al contexto
                closeModal(); // Cerramos el modal
                setEmail(''); // Limpiar el campo email
                setPassword(''); // Limpiar el campo password
                setError(''); // Limpiar posibles errores
            } else {
                // Mostrar error
                setError(data.message || 'Hubo un error en el inicio de sesión');
            }
        } catch (err) {
            console.error('Error en la solicitud:', err);
            setError('Error en la conexión');
        }
    };

    // Limpiar los campos cuando se cierra el modal sin hacer login
    const handleCloseModal = () => {
        closeModal();
        setEmail(''); // Limpiar el email
        setPassword(''); // Limpiar la contraseña
        setError(''); // Limpiar el error
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <button className="close-btn" onClick={handleCloseModal}>X</button>
                <h2>Iniciar Sesion</h2>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Correo electr&oacute;nico</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" className="submit-btn">Iniciar Sesi&oacute;n</button>
                </form>
            </div>
        </div>
    );
}

export default LoginModal;
