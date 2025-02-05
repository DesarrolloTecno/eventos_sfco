import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/library';
import axios from 'axios';
import { Button, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/App.css';

function Scanner() {
    const { eventId } = useParams();
    const [decodedInfo, setDecodedInfo] = useState(null);
    const [documentMatch, setDocumentMatch] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [userInfo, setUserInfo] = useState({ nombre: '', rol: '', color: '' });
    const [eventName, setEventName] = useState('');
    const [isCameraVisible, setIsCameraVisible] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isEntry, setIsEntry] = useState(true);

    const isRequestInProgress = useRef(false);

    const sendLogRequest = async (eventId, userId, estado) => {
        if (isRequestInProgress.current) return;
        isRequestInProgress.current = true;

        try {
            const logResponse = await axios.post(`/api/log/${eventId}`, { userId, estado });
            if (logResponse.data.message && logResponse.data.message.includes('registro exitoso')) {
                console.log('Registro realizado correctamente.');
            }
        } catch (error) {
            console.error("Error al enviar el log: ", error.response?.data || error);
            setErrorMessage(error.response?.data?.message || 'Error al registrar la acción.');
        } finally {
            isRequestInProgress.current = false;
        }
    };

    useEffect(() => {
        const fetchEventName = async () => {
            try {
                const response = await axios.get(`/api/events/${eventId}`);
                setEventName(response.data.nombre);
            } catch (error) {
                console.error('Error al obtener el nombre del evento:', error);
                setErrorMessage('No se pudo cargar el nombre del evento.');
            }
        };

        fetchEventName();
    }, [eventId]);

    const parseData = useCallback((dataString) => {
        const dataArray = dataString.split('@');
        return {
            dni: dataArray[0],
            apellido: dataArray[1],
            nombre: dataArray[2],
            numDocumento: dataArray[4],
        };
    }, []);

    useEffect(() => {
        if (!isCameraVisible) return;

        const codeReader = new BrowserMultiFormatReader();
        const videoElement = document.getElementById('video');

        const startScanning = async () => {
            try {
                if (isProcessing || !isCameraVisible) return;

                await codeReader.decodeFromVideoDevice(null, videoElement, async (result, error) => {
                    if (isProcessing || !isCameraVisible) return;

                    if (error) {
                        if (error.name !== 'NotFoundException') {
                            console.error('Error al leer el código:', error.message || error);
                            setErrorMessage('Error al leer el código.');
                        }
                        return;
                    }

                    if (result) {
                        setIsProcessing(true);
                        const parsedData = parseData(result.getText());
                        setDecodedInfo(parsedData);

                        if (!parsedData.numDocumento) {
                            setErrorMessage('Datos escaneados inválidos.');
                            setIsProcessing(false);
                            return;
                        }

                        try {
                            const validateResponse = await axios.post(`/api/validate/${eventId}`, {
                                dni: parsedData.numDocumento,
                            });

                            if (validateResponse.data.match) {
                                setDocumentMatch(true);
                                const { user } = validateResponse.data;
                                setUserInfo({ nombre: user.usuario, rol: user.rol, color: user.color });

                                await sendLogRequest(eventId, user.id_usuario, isEntry ? 1 : 0);
                            } else {
                                setDocumentMatch(false);
                                setUserInfo({ nombre: '', rol: '', color: '' });
                                setErrorMessage('Documento no encontrado.');
                            }
                        } catch (error) {
                            setErrorMessage('Error al conectar con el servidor.');
                        } finally {
                            setIsProcessing(false);
                        }

                        setIsCameraVisible(false);
                        codeReader.reset();
                    }
                });
            } catch (error) {
                setErrorMessage('No se pudo acceder a la cámara. Verifica los permisos.');
            }
        };

        startScanning();

        return () => {
            codeReader.reset();
        };
    }, [eventId, isCameraVisible, isProcessing, parseData, isEntry]);

    const handleRetry = () => {
        setDecodedInfo(null);
        setDocumentMatch(false);
        setErrorMessage('');
        setUserInfo({ nombre: '', rol: '', color: '' });

        setIsCameraVisible(false);
        setTimeout(() => setIsCameraVisible(true), 100);
    };

    return (
        <Container fluid className="app-container">
            <Row className="justify-content-center text-center">
                <Col xs={12} className="mb-3">
                    <h2 className="app-title">
                        {eventName ? `Evento: ${eventName}` : <Spinner animation="border" />}
                    </h2>
                </Col>
                <Col xs={12} className="mb-2">
                    <Button
                        variant={isEntry ? 'primary' : 'outline-primary'}
                        className="me-2"
                        onClick={() => {
                            if (!isEntry) {
                                setIsEntry(true);
                                handleRetry();
                            }
                        }}
                    >
                        Entrada
                    </Button>

                    <Button
                        variant={!isEntry ? 'danger' : 'outline-danger'}
                        onClick={() => {
                            if (isEntry) {
                                setIsEntry(false);
                                handleRetry();
                            }
                        }}
                    >
                        Salida
                    </Button>
                </Col>
            </Row>

            {isCameraVisible && (
                <Row className="justify-content-center">
                    <Col xs={12} md={6}>
                        <div className="video-container">
                            <video id="video" className="video" />
                        </div>
                    </Col>
                </Row>
            )}

            {isProcessing && (
                <Row className="justify-content-center mt-3">
                    <Col xs={12} md={6}>
                        <Spinner animation="grow" variant="primary" />
                    </Col>
                </Row>
            )}

            {decodedInfo && (
                <Row className="justify-content-center mt-3">
                    <Col xs={12} md={6}>
                        <Card className="text-center">
                            <Card.Body>
                                {documentMatch ? (
                                    <Alert variant="success">
                                        <p><strong>Nombre:</strong> {userInfo.nombre}</p>
                                        <p><strong>Rol:</strong> {userInfo.rol}</p>
                                        <p><strong>Acción:</strong> {isEntry ? 'Entrada' : 'Salida'}</p>
                                    </Alert>
                                ) : (
                                    <Alert variant="danger">Documento no encontrado.</Alert>
                                )}
                                <Button variant="warning" onClick={handleRetry}>Escanear otro documento</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {errorMessage && (
                <Row className="justify-content-center mt-3">
                    <Col xs={12} md={6}>
                        <Alert variant="danger">{errorMessage}</Alert>
                    </Col>
                </Row>
            )}
        </Container>
    );
}

export default Scanner;
