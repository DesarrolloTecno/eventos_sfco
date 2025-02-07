import React, { useState } from 'react';
import { Container, Row, Col, Tabs, Tab } from 'react-bootstrap';
import ScannerCamera from './ScannerCamera';
import ScannerInput from './ScannerInput';

function Scanner() {
  const [eventId] = useState(1);  // Asume que tienes un eventId
  const [isEntry, setIsEntry] = useState(true);
  const [decodedInfo, setDecodedInfo] = useState(null);
  const [userInfo, setUserInfo] = useState({ nombre: '', rol: '', color: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleToggleEntryExit = (checked) => {
    setIsEntry(checked);
  };

  return (
    <Container fluid className="app-container">
      <Tabs defaultActiveKey="camera" id="scanner-tabs">
        <Tab eventKey="camera" title="Escanear Cámara">
          <ScannerCamera
            eventId={eventId}
            isEntry={isEntry}
            handleToggleEntryExit={handleToggleEntryExit}
            setDecodedInfo={setDecodedInfo}
            setUserInfo={setUserInfo}
            setErrorMessage={setErrorMessage}
            setSuccessMessage={setSuccessMessage}
          />
        </Tab>
        <Tab eventKey="input" title="Escanear desde texto">
          <ScannerInput
            eventId={eventId}
            isEntry={isEntry}
            handleToggleEntryExit={handleToggleEntryExit}
            setDecodedInfo={setDecodedInfo}
            setUserInfo={setUserInfo}
            setErrorMessage={setErrorMessage}
            setSuccessMessage={setSuccessMessage}
          />
        </Tab>
      </Tabs>
    </Container>
  );
}

export default Scanner;
