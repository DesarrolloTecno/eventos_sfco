import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Scanner from './Scanner';
import Logs from './Logs';
import Users from './Users';  // Nuevo componente de usuarios
import { Container, Row, Col, Nav, Tab } from 'react-bootstrap';
import '../styles/ScannerTabs.css';

const ScannerTabs = () => {
  const { eventId } = useParams();
  const [activeTab, setActiveTab] = useState('scanner');
  const [logsKey, setLogsKey] = useState(0); // 🔄 Estado para forzar la recarga de Logs
  const [scannerKey, setScannerKey] = useState(0); // 🔄 Estado para forzar la recarga del scanner
  const [usersKey, setUsersKey] = useState(0); // 🔄 Estado para forzar la recarga de usuarios

  const handleSelect = useCallback((key) => {
    setActiveTab(key);

    // Forzar la recarga de los componentes según la solapa seleccionada
    if (key === 'logs') {
      setLogsKey(prevKey => prevKey + 1);
    } else if (key === 'scanner') {
      setScannerKey(prevKey => prevKey + 1);
    } else if (key === 'users') {
      setUsersKey(prevKey => prevKey + 1);
    }
  }, []);

  return (
    <Container fluid className="mt-3">
      <Tab.Container activeKey={activeTab} onSelect={handleSelect}>
        <Row>
          <Col>
            <Nav variant="tabs" className="justify-content-center">
              <Nav.Item>
                <Nav.Link eventKey="scanner">📷 Escaneo</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="logs">📜 Ingresos/Egresos</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="users">👥 Usuarios</Nav.Link> {/* Nueva solapa de usuarios */}
              </Nav.Item>
            </Nav>
          </Col>
        </Row>

        <Row>
          <Col>
            <Tab.Content>
              <Tab.Pane eventKey="scanner" key={`scanner-${scannerKey}`}>
                <Scanner eventId={eventId} />
              </Tab.Pane>
              <Tab.Pane eventKey="logs" key={`logs-${logsKey}`}>
                <Logs eventId={eventId} />
              </Tab.Pane>
              <Tab.Pane eventKey="users" key={`users-${usersKey}`}>
                <Users eventId={eventId} />
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default ScannerTabs;
