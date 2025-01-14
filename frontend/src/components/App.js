import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EventList from './EventList';
import ScannerTabs from './ScannerTabs';
import Header from './Header';
import Footer from './Footer';

function App() {
    const isLoggedIn = () => {
        return !!localStorage.getItem('user'); // Ejemplo usando localStorage.
    };

    return (
        <>
            <Header />
            <Routes>
                <Route path="/" element={<EventList />} />
                <Route
                    path="/scanner/:eventId"
                    element={
                        isLoggedIn() ? (
                            <ScannerTabs /> // Aquí no pasas eventId como prop directamente
                        ) : (
                            <Navigate to="/login" />  // Redirige al login si no está autenticado
                        )
                    }
                />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Footer />
        </>
    );
}

export default App;
