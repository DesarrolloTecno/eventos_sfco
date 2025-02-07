import React, { useState, useEffect, useRef } from 'react';
import { Form, Row, Col, Card } from 'react-bootstrap';
import axios from 'axios';

function ScannerInput({ eventId, isEntry, handleToggleEntryExit, setDecodedInfo, setUserInfo, setErrorMessage, setSuccessMessage }) {
  const [inputData, setInputData] = useState('');
  const inputRef = useRef(null);

  const handleInputChange = async (e) => {
    const input = e.target.value;
    setInputData(input);

    if (input.length > 0) {
      try {
        const parsedData = parseData(input);
        setDecodedInfo(parsedData);

        if (!parsedData.numDocumento) return;

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
  };

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
    inputRef.current?.focus();
  }, []);

  return (
    <Row className="justify-content-center my-3">
      <Col xs={12} md={6}>
        <Form className="d-flex align-items-center justify-content-end">
          <Form.Check
            type="switch"
            id="entry-exit-toggle-text"
            label={isEntry ? 'Entrada' : 'Salida'}
            checked={isEntry}
            onChange={(e) => handleToggleEntryExit(e.target.checked)}
            className="me-2"
            style={{ fontSize: '1.5rem', transform: 'scale(1.2)' }}
          />
        </Form>
      </Col>

      <Col xs={12} md={6}>
        <Form.Control
          type="text"
          value={inputData}
          onChange={handleInputChange}
          placeholder="Escanea el código aquí"
          ref={inputRef}
        />
      </Col>

      {(setErrorMessage || setSuccessMessage) && (
        <Card className="mt-3" bg={setErrorMessage ? "danger" : "success"} text="white">
          <Card.Body>
            <h5>{setErrorMessage ? 'Error' : '¡Éxito!'}</h5>
            <p>{setErrorMessage || setSuccessMessage}</p>
          </Card.Body>
        </Card>
      )}
    </Row>
  );
}

export default ScannerInput;
