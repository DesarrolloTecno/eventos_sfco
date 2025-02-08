import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Importamos useNavigate
import { useAuth } from './AuthContext'; // Importamos el contexto de autenticación
import '../styles/Header.css';
import LoginModal from './LoginModal'; // Importamos el modal de login
import '../styles/LoginModal.css';

function Header() {
    const [isModalOpen, setModalOpen] = useState(false); // Estado para controlar la apertura del modal
    const { user, login, logout } = useAuth(); // Obtenemos el usuario y la función logout del contexto
    const navigate = useNavigate(); // Hook para redirección

    const handleLogout = () => {
        logout(); // Cerramos sesión
        navigate('/'); // Redirigimos al home
    };

    const handleLoginSuccess = (userData) => {
        login(userData); // Llamamos a login para actualizar el contexto
        setModalOpen(false); // Cerramos el modal después de un inicio de sesión exitoso
        navigate('/'); // Opcional: redirigir a la página principal después de login exitoso
    };

    const openModal = () => setModalOpen(true); // Abre el modal
    const closeModal = () => setModalOpen(false); // Cierra el modal

    return (
        <header className="header">
            <div className="header-left">
                <Link to="/" className="header-title">
                    <h1>Eventos San Fco</h1>
                </Link>
            </div>
            <div className="header-right">
                {user ? ( // Si hay un usuario autenticado
                    <>
                        <span className="username">Hola, {user.username}</span> 
                        <t></t>
                        <button className="logout-button" onClick={handleLogout}>
                            <b>Cerrar Sesi&oacute;n</b> 
                        </button>
                    </>
                ) : ( // Si no hay usuario autenticado
                    <button className="login-button" onClick={openModal}>
                        Iniciar Sesi&oacute;n
                    </button>
                )}
            </div>
            <LoginModal isOpen={isModalOpen} closeModal={closeModal} onLoginSuccess={handleLoginSuccess} /> {/* Aquí insertamos el modal */}
        </header>
    );
}

export default Header;
