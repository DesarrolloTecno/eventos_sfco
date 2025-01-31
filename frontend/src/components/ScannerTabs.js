import React, { useState } from 'react';
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

    const handleSelect = (key) => {
        setActiveTab(key);
        if (key === 'logs') {
            setLogsKey((prevKey) => prevKey + 1); // 🔄 Cambia el key para forzar renderizado
        }
    };

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
                            <Tab.Pane eventKey="scanner">
                                <Scanner eventId={eventId} />
                            </Tab.Pane>
                            <Tab.Pane eventKey="logs">
                                <Logs key={logsKey} eventId={eventId} />
                            </Tab.Pane>
                            <Tab.Pane eventKey="users">
                                <Users eventId={eventId} /> {/* Mostrar información de usuarios */}
                            </Tab.Pane>
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>
        </Container>
    );
};

export default ScannerTabs;
