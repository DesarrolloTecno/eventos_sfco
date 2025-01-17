import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/library';
import axios from 'axios';
import { Button } from 'react-bootstrap'; // Importa el componente Button de react-bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'; // Importa los estilos de bootstrap
import '../styles/App.css'; // Mantenemos los estilos

function Scanner() {
    const { eventId } = useParams();
    const [decodedInfo, setDecodedInfo] = useState(null);
    const [documentMatch, setDocumentMatch] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [userInfo, setUserInfo] = useState({ nombre: '', rol: '', color: '' });
    const [eventName, setEventName] = useState('');
    const [isCameraVisible, setIsCameraVisible] = useState(true); // Controla la visibilidad de la cámara
    const [isProcessing, setIsProcessing] = useState(false); // Estado para controlar si ya se está procesando
    const [isEntry, setIsEntry] = useState(true); // Estado para determinar entrada o salida

    // Variable para evitar solicitudes duplicadas
    let isRequestInProgress = false;

    const sendLogRequest = async (eventId, userId, estado) => {
        if (isRequestInProgress) return; // Evitar enviar la solicitud si ya está en progreso
        isRequestInProgress = true; // Marcar que la solicitud está en progreso

        try {
            const logResponse = await axios.post(`/api/log/${eventId}`, {
                userId,
                estado,
            });

            if (logResponse.data.message.includes('registro exitoso')) {
                console.log('Registro realizado correctamente.');
            }
        } catch (error) {
            console.error("Error al enviar el log: ", error.response.data);
        } finally {
            isRequestInProgress = false; // Restablecer el estado una vez que la solicitud termine
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
        const codeReader = new BrowserMultiFormatReader();
        const videoElement = document.getElementById('video');

        const startScanning = async () => {
            try {
                // Verifica si ya se está procesando
                if (isProcessing) return;

                await codeReader.decodeFromVideoDevice(null, videoElement, async (result, error) => {
                    if (isProcessing) return; // Evita procesar múltiples veces

                    if (error) {
                        if (error.name !== 'NotFoundException') {
                            console.error('Error al leer el código:', error.message || error);
                        }
                        return;
                    }

                    if (result) {
                        setIsProcessing(true); // Inicia el procesamiento

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
                                setUserInfo({
                                    nombre: user.usuario,
                                    rol: user.rol,
                                    color: user.color,
                                });

                                // Enviar solicitud para registrar el log (entrada/salida)
                                await sendLogRequest(eventId, user.id_usuario, isEntry ? 1 : 0);

                            } else {
                                setDocumentMatch(false);
                                setUserInfo({ nombre: '', rol: '', color: '' });
                            }
                        } catch (error) {
                            setErrorMessage('Error al conectar con el servidor.');
                        } finally {
                            setIsProcessing(false); // Finaliza el procesamiento
                        }

                        // Eliminar la cámara inmediatamente después de escanear
                        setIsCameraVisible(false);
                        codeReader.reset(); // Detenemos explícitamente el lector
                    }
                });
            } catch (error) {
                setErrorMessage('No se pudo acceder a la cámara. Verifica los permisos.');
            }
        };

        const stopCamera = () => {
            codeReader.reset(); // Aseguramos que el lector se detenga al desmontar el componente
        };

        if (isCameraVisible) {
            startScanning();
        }

        return () => {
            stopCamera();
        };
    }, [eventId, isCameraVisible, isProcessing, parseData, isEntry]);

    const handleRetry = () => {
        setDecodedInfo(null);
        setDocumentMatch(false);
        setErrorMessage('');
        setUserInfo({ nombre: '', rol: '', color: '' });
        setIsCameraVisible(true); // Reactivar la cámara para un nuevo escaneo
    };

    return (
        <div
            style={{
                backgroundColor: userInfo.color || '#ffffff',
                color: userInfo.color ? '#ffffff' : '#000000',
                minHeight: '100vh',
            }}
        >
            <div className="event-header" style={{ display: 'flex', alignItems: 'center' }}>
                <h1>{eventName ? `Evento: ${eventName}` : 'Cargando evento...'}</h1>

                <div className="action-selector" style={{ marginLeft: '20px' }}>
                    <Button
                        variant={isEntry ? 'primary' : 'secondary'}
                        onClick={() => setIsEntry(true)}
                    >
                        Entrada
                    </Button>
                    <Button
                        variant={!isEntry ? 'primary' : 'secondary'}
                        onClick={() => setIsEntry(false)}
                    >
                        Salida
                    </Button>
                </div>
            </div>

            {/* Condicional para ocultar el div de la cámara si no se está escaneando */}
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
                            <p><strong>Acción:</strong> {isEntry ? 'Entrada' : 'Salida'}</p>
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
