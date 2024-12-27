import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EventList from './EventList';
import Scanner from './Scanner';
import Header from './Header'; 
import Footer from './Footer'; 
import '../styles/App.css';
function App() {
    return (
        <>
            <Header/>
            <Routes>
                <Route path="/" element={<EventList />} />
                <Route path="/scanner/:eventId" element={<Scanner />} />
            </Routes>
            <Footer />
        </>
    );
}

export default App;