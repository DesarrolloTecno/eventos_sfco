import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './components/App.js';
import './index.css';
import { AuthProvider } from './components/AuthContext';  // Asegúrate de importar el AuthProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider> {/* Asegúrate de envolver tu aplicación en el AuthProvider */}
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);