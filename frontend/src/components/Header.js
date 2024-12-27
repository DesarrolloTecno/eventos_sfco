import React, { useState } from 'react';
import { Link } from 'react-router-dom';  // Importamos Link
import '../styles/Header.css';
import LoginModal from './LoginModal';  // Importamos el modal de login
import '../styles/LoginModal.css'; 


function Header() {
    const [isModalOpen, setModalOpen] = useState(false);  // Estado para controlar la apertura del modal

    const openModal = () => setModalOpen(true);  // Abre el modal
    const closeModal = () => setModalOpen(false);  // Cierra el modal

    return (
        <header className="header">
            <div className="header-left">
                <Link to="/" className="header-title">
                    <h1>Eventos San Fco</h1>
                </Link>
            </div>
            <div className="header-right">
                <button className="login-button" onClick={openModal}>Iniciar Sesion</button>
            </div>
            <LoginModal isOpen={isModalOpen} closeModal={closeModal} /> {/* Aquí insertamos el modal */}
        </header>
    );
}

export default Header;