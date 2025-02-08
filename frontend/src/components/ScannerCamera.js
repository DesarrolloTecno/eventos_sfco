import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Row, Col, Card, Spinner, Form } from 'react-bootstrap';
import axios from 'axios';
import { BrowserMultiFormatReader } from '@zxing/library';

function ScannerCamera({ eventId, isEntry, handleToggleEntryExit, setDecodedInfo, setUserInfo, setErrorMessage, setSuccessMessage }) {
  const [eventName, setEventName] = useState('');
  const [isCameraVisible, setIsCameraVisible] = useState(true);
  const videoElement = useRef(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const hasScanned = useRef(false);

  useEffect(() => {
    const fetchEventName = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/events/${eventId}`);
        setEventName(response.data.nombre);
      } catch (error) {
        setErrorMessage('Error al obtener el nombre del evento.');
      }
    };

    if (eventId) {
      fetchEventName();
    }
  }, [eventId, setErrorMessage]);

  const startScanning = useCallback(async () => {
    if (!videoElement.current) {
      setErrorMessage('No se pudo encontrar el elemento de video.');
      return;
    }

    hasScanned.current = false;
    setSuccessMessage('');
    setIsCameraVisible(true);

    // Limpiamos cualquier error previo solo al iniciar el escaneo
    setErrorMessage('');

    // Iniciar escaneo
    codeReader.current.decodeFromVideoDevice(null, videoElement.current, async (result, error) => {
      if (error || hasScanned.current) {
        // Aseguramos que solo se muestre el error si realmente hay un problema
        if (error && !hasScanned.current) {
          setErrorMessage('Error al intentar leer el código.');
        }
        return;
      }

      if (result) {
        hasScanned.current = true;
        setIsCameraVisible(false);

        const parsedData = parseData(result.getText());
        setDecodedInfo(parsedData);

        if (!parsedData.numDocumento) return;

        try {
          const validateResponse = await axios.post(`/api/validate/${eventId}`, { dni: parsedData.numDocumento });

          if (validateResponse.data.match) {
            setUserInfo({
              nombre: validateResponse.data.user.usuario,
              rol: validateResponse.data.user.rol,
              color: validateResponse.data.user.color,
            });

            await sendLogRequest(eventId, validateResponse.data.user.id_usuario, isEntry ? 1 : 0);
            setSuccessMessage(`¡Ingreso/Salida Registrado Exitosamente! \nNombre: ${validateResponse.data.user.usuario} \nRol: ${validateResponse.data.user.rol}`);
          } else {
            setErrorMessage('Documento no encontrado.');
          }
        } catch (error) {
          setErrorMessage(error.response?.data?.message || 'Error al conectar con el servidor.');
        }
      }
    });
  }, [eventId, isEntry, setDecodedInfo, setUserInfo, setErrorMessage, setSuccessMessage]);



  const parseData = (dataString) => {
    const dataArray = dataString.split('@');
    return {
      dni: dataArray[0],
      apellido: dataArray[1],
      nombre: dataArray[2],
      numDocumento: dataArray[4],
    };
  };

  const sendLogRequest = async (eventId, userId, estado) => {
    try {
      await axios.post(`/api/log/${eventId}`, { userId, estado });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Error al registrar la acción.');
    }
  };

  useEffect(() => {
    if (isCameraVisible) {
      startScanning();
    }

    return () => {
      codeReader.current.reset();
    };
  }, [startScanning, isCameraVisible]);

  return (
    <Row className="justify-content-center my-3">
      {/* Fila superior con el formulario */}
      <Col xs={12} className="text-center mb-3">
        <h4>{eventName ? eventName : <Spinner animation="border" />}</h4>
        <Form className="d-flex justify-content-center">
          <Form.Check
            type="switch"
            id="entry-exit-toggle"
            label={isEntry ? 'Entrada' : 'Salida'}
            checked={isEntry}
            onChange={(e) => handleToggleEntryExit(e.target.checked)}
            className="me-2"
            style={{ fontSize: '1.5rem', transform: 'scale(1.2)' }}
          />
        </Form>
      </Col>

      {/* Fila con la cámara */}
      {isCameraVisible && (
        <Col xs={12} md={6} className="d-flex justify-content-center">
          <div className="video-container">
            <video ref={videoElement} width="100%" height="auto" style={{ border: '1px solid #ccc' }} />
          </div>
        </Col>
      )}

      {/* Mensajes de éxito/error */}
      {setErrorMessage && (
        <Card className="mt-3" bg="danger" text="white">
          <Card.Body>
            <h5>Error</h5>
            <p>{setErrorMessage}</p>
          </Card.Body>
        </Card>
      )}

      {setSuccessMessage && (
        <Card className="mt-3" bg="success" text="white">
          <Card.Body>
            <h5>¡Éxito!</h5>
            <p>{setSuccessMessage}</p>
          </Card.Body>
        </Card>
      )}

    </Row>
  );
}

export default ScannerCamera;
