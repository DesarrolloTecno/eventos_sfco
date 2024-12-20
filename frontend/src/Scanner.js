import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/library';
import axios from 'axios';
import './App.css';

function Scanner() {
    const [data, setData] = useState(null);
    const [scanning, setScanning] = useState(true);
    const [decodedInfo, setDecodedInfo] = useState({});
    const [documentMatch, setDocumentMatch] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [userInfo, setUserInfo] = useState({ nombre: '', rol: '', color: '' }); // Añadir color al estado
    const [scanned, setScanned] = useState(false);
    const { eventId } = useParams();

    const formsToSupport = [BarcodeFormat.PDF_417];

    const parseData = (dataString) => {
        const dataArray = dataString.split('@');
        return {
            dni: dataArray[0],
            apellido: dataArray[1],
            nombre: dataArray[2],
            numDocumento: dataArray[4],
        };
    };

    useEffect(() => {
        const codeReader = new BrowserMultiFormatReader();
        const videoElement = document.getElementById('video');

        const startScanning = async () => {
            try {
                await codeReader.decodeFromVideoDevice(
                    null,
                    videoElement,
                    async (result, error) => {
                        if (result) {
                            const parsedData = parseData(result.getText());
                            setData(result.getText());
                            setDecodedInfo(parsedData);
                            setScanning(false);
                            setScanned(true);

                            try {
                                const response = await axios.post('http://localhost:5000/api/validate-dni', {
                                    dni: parsedData.numDocumento,
                                });

                                if (response.data.match) {
                                    setDocumentMatch(true);
                                    setUserInfo({
                                        nombre: response.data.user.usuario,
                                        rol: response.data.user.rol,
                                        color: response.data.user.color, // Captura el color
                                    });
                                } else {
                                    setDocumentMatch(false);
                                    setUserInfo({ nombre: '', rol: '', color: '' });
                                }
                            } catch (error) {
                                console.error('Error al conectar con el backend:', error);
                                setErrorMessage('Error al conectar con el servidor.');
                            }
                        }

                        if (error) console.error(error);
                    }
                );
            } catch (error) {
                console.error('Error al iniciar el escaneo:', error);
                setErrorMessage('No se pudo acceder a la cámara.');
            }
        };

        if (scanning) startScanning();

        return () => codeReader.reset();
    }, [scanning]);

    return (
        <div
            className="App"
            style={{
                backgroundColor: userInfo.color || '#ffffff',
                color: userInfo.color ? '#ffffff' : '#000000', // Texto blanco si hay color de fondo
                minHeight: '100vh',
                transition: 'background-color 0.5s ease, color 0.5s ease',
            }}
        >
            <h1>Lector de Códigos Automático</h1>

            <div className="video-container">
                <video id="video" className="video" />
            </div>

            {errorMessage && <p className="error-message">{errorMessage}</p>}

            {scanned ? (
                documentMatch ? (
                    <div>
                        <div className="check-circle">
                            <span className="check-icon">✔</span>
                        </div>
                        <p>Documento válido y encontrado en la base de datos.</p>
                        <p>
                            <strong>Nombre:</strong> {userInfo.nombre}
                        </p>
                        <p>
                            <strong>Rol:</strong> {userInfo.rol}
                        </p>
                    </div>
                ) : (
                    <div>
                        <div className="cross-circle">
                            <span className="cross-icon">✖</span>
                        </div>
                        <p>Documento no encontrado en la base de datos.</p>
                    </div>
                )
            ) : (
                <p>Escanee un DNI...</p>
            )}

            {!scanning && (
                <button
                    onClick={() => {
                        setScanning(true);
                        setScanned(false);
                        setUserInfo({ nombre: '', rol: '', color: '' });
                        setErrorMessage('');
                    }}
                    className="restart-button"
                >
                    Reiniciar Escaneo
                </button>
            )}
        </div>
    );
}

export default Scanner;
