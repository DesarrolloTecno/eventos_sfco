import React, { useState } from 'react';
import '../styles/LoginModal.css'; // Estilos para el modal

function LoginModal({ isOpen, closeModal }) {
    if (!isOpen) return null; // Si no está abierto, no se renderiza el modal

    return (
        <div className="modal-overlay">
            <div className="modal">
                <button className="close-btn" onClick={closeModal}>X</button>
                <h2>Iniciar Sesion</h2>
                <form className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Correo electronico</label>
                        <input type="email" id="email" name="email" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" name="password" required />
                    </div>
                    <button type="submit" className="submit-btn">Iniciar Sesion</button>
                </form>
            </div>
        </div>
    );
}

export default LoginModal;