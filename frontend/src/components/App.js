import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import EventList from './EventList';
import ScannerTabs from './ScannerTabs';
import NewUser from './NewUser';
import UserList from './UserList';
import Header from './Header';
import Footer from './Footer';

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<EventList />} />
        <Route path="/scanner/:eventId" element={<ScannerTabs />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/new-user" element={<NewUser />} />
        <Route path="/edit-user/:userId" element={<NewUser />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
