import React, { useState } from 'react';
import { Container, Row, Col, Tabs, Tab } from 'react-bootstrap';
import ScannerCamera from './ScannerCamera';
import ScannerInput from './ScannerInput';
import axios from 'axios';


function Scanner({checked, setChecked}) {
  const [eventId] = useState(1);  // Asume que tienes un eventId
  const [decodedInfo, setDecodedInfo] = useState(null);
  const [userInfo, setUserInfo] = useState({ nombre: '', rol: '', color: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isEntry, setIsEntry] = useState('');
  const [userId, setUserId]=useState("")

  
  const sendLogRequest = async (eventId, userId) => {
    try {
      return await axios.post(`/api/log/${eventId}`, { userId, checked });
    } catch (error) {
      return error.response;
    }
  };




  const handleToggleEntryExit = (value) => {
    // if(value){
    //   setTrue()
    // }else{
    //   setFalse()
    // }

  };

  return (
    <Container fluid className="app-container">
      <Tabs defaultActiveKey="input" id="scanner-tabs">
{/*         <Tab eventKey="camera" title="Escanear Cámara">
          <ScannerCamera
            eventId={eventId}
            isEntry={isEntry}
            handleToggleEntryExit={handleToggleEntryExit}
            setDecodedInfo={setDecodedInfo}
            setUserInfo={setUserInfo}
            setErrorMessage={setErrorMessage}
            setSuccessMessage={setSuccessMessage}
          />
        </Tab> */}
        <Tab eventKey="input" title="Escanear desde texto">
          <ScannerInput
            eventId={eventId}
            isEntry={isEntry}
            handleToggleEntryExit={handleToggleEntryExit}
            setDecodedInfo={setDecodedInfo}
            setUserInfo={setUserInfo}
            setErrorMessage={setErrorMessage}
            setSuccessMessage={setSuccessMessage}
            checked={checked}
            setChecked={setChecked}
            setUserId={setUserId}
            userId= {userId}
            sendLogRequest={sendLogRequest}
          />

        </Tab>
      </Tabs>
    </Container>
  );
}

export default Scanner;
