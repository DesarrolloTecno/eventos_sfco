import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/library';
import axios from 'axios';
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
        const codeReader = new BrowserMultiFormatReader();
        const videoElement = document.getElementById('video');

        const startScanning = async () => {
            try {
                await codeReader.decodeFromVideoDevice(null, videoElement, async (result, error) => {
                    if (isProcessing) return;

                    if (error) {
                        if (error.name !== 'NotFoundException') {
                            console.error('Error al leer el código:', error.message || error);
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
                            const response = await axios.post('/api/validate-dni', {
                                dni: parsedData.numDocumento,
                                eventId,
                            });

                            if (response.data.match) {
                                setDocumentMatch(true);
                                setUserInfo({
                                    nombre: response.data.user.usuario,
                                    rol: response.data.user.rol,
                                    color: response.data.user.color,
                                });
                                stopCamera();
                            } else {
                                setDocumentMatch(false);
                                setUserInfo({ nombre: '', rol: '', color: '' });
                            }

                            setIsCameraVisible(false);
                        } catch (error) {
                            setErrorMessage('Error al conectar con el servidor.');
                        } finally {
                            setIsProcessing(false);
                        }
                    }
                });
            } catch (error) {
                setErrorMessage('No se pudo acceder a la cámara. Verifica los permisos.');
            }
        };

        const stopCamera = () => {
            codeReader.reset();
        };

        if (isCameraVisible) {
            startScanning();
        }

        return () => {
            stopCamera();
        };
    }, [eventId, isCameraVisible, isProcessing, parseData]);

    const handleRetry = () => {
        setDecodedInfo(null);
        setDocumentMatch(false);
        setErrorMessage('');
        setUserInfo({ nombre: '', rol: '', color: '' });
        setIsCameraVisible(true);
    };

    return (
        <div
            style={{
                backgroundColor: userInfo.color || '#ffffff',
                color: userInfo.color ? '#ffffff' : '#000000',
                minHeight: '100vh',
            }}
        >
            <h1>{eventName ? `Evento: ${eventName}` : 'Cargando evento...'}</h1>

            {isCameraVisible && (
                <div className="video-container">
                    <video id="video" className="video" />
                </div>
            )}

            {decodedInfo && (
                <div>
                    {documentMatch ? (
                        <div className="document-info">
                            <p><strong>Nombre:</strong> {userInfo.nombre}</p>
                            <p><strong>Rol:</strong> {userInfo.rol}</p>
                        </div>
                    ) : (
                        <div className="no-match-message">
                            <p>Documento no encontrado.</p>
                        </div>
                    )}

                    <button className="restart-button" onClick={handleRetry}>Escanear otro documento</button>
                </div>
            )}

            {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
    );
}

export default Scanner;
