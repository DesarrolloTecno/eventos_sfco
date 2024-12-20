import React from 'react';
import { Routes, Route } from 'react-router-dom';
import EventList from './EventList';
import Scanner from './Scanner';

function App() {
    return (
        <Routes>
            <Route path="/" element={<EventList />} />
            <Route path="/scanner/:eventId" element={<Scanner />} />
        </Routes>
    );
}

export default App;