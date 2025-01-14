import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Creamos el contexto de autenticaci�n
const AuthContext = createContext();

// Proveedor de autenticaci�n
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Funci�n para iniciar sesi�n
    const login = (userData) => {
        setUser(userData); // Guardamos los datos del usuario en el estado
        localStorage.setItem('user', JSON.stringify(userData)); // Guardamos el usuario en el localStorage
        navigate('/'); // Redirigimos al home
    };

    // Funci�n para cerrar sesi�n
    const logout = () => {
        setUser(null); // Limpiamos el estado del usuario
        localStorage.removeItem('user'); // Limpiamos el localStorage
        navigate('/'); // Redirigimos al home
    };

    // Verificamos si hay un usuario almacenado en el localStorage al cargar la aplicaci�n
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook para acceder al contexto
export const useAuth = () => useContext(AuthContext);
