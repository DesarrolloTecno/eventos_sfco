import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Row, Col, Table } from 'react-bootstrap';
import axios from 'axios';
import { debounce } from 'lodash';
import EntryExitToggle from './EntryExitToggle'; 

function ScannerInput({ eventId, isEntry, handleToggleEntryExit }) {
  const [inputData, setInputData] = useState('');
  const [requests, setRequests] = useState([]);
  const [isError, setIsError] = useState(false);
  const inputRef = useRef(null);

  const validateDNI = async (dni, apellido, nombre) => {
    try {
      const validateResponse = await axios.post(`hhttps://eventback-f6aiwsqjia-uc.a.run.app/api/validate/${eventId}`, { dni });
      const responseData = validateResponse.data;

      let logResponse = null;
      let logMessage = '';

      if (responseData.match) {
        const user = responseData.user;

        const estado = isEntry ? 1 : 0; // Aquí aseguramos que cuando el checkbox está desmarcado, envía 0.

        logResponse = await sendLogRequest(eventId, user.id_usuario, estado);
        logMessage = logResponse?.data?.message || '';
      }

      setRequests(prevRequests => [
        ...prevRequests,
        { dni, apellido, nombre, response: responseData, logResponse, logMessage }
      ]);

      setInputData('');
    } catch (error) {
      setRequests(prevRequests => [
        ...prevRequests,
        { dni, apellido, nombre, response: { error: 'Error al conectar con el servidor.' } }
      ]);

      setInputData('');
    }
  };

  const debouncedValidateDNI = useCallback(debounce(validateDNI, 500), [isEntry]); // Se asegura de usar el valor actual

  const handleInputChange = (e) => {
    const input = e.target.value;
    setInputData(input);

    if (input.length > 0) {
      try {
        const parsedData = parseData(input);

        if (!parsedData.numDocumento) return;

        debouncedValidateDNI(parsedData.numDocumento, parsedData.apellido, parsedData.nombre);
      } catch (error) {
        console.error('Error al procesar los datos.', error);
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
      return await axios.post(`https://eventback-f6aiwsqjia-uc.a.run.app//api/log/${eventId}`, { userId, estado });
    } catch (error) {
      return error.response;
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <Row className="justify-content-center my-3">
        <Col xs={12} md={6}>
          <EntryExitToggle isEntry={isEntry} handleToggleEntryExit={handleToggleEntryExit} />
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
      </Row>

      <Row className="mt-4">
        <Col>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>DNI</th>
                <th>Apellido</th>
                <th>Nombre</th>
                <th>Respuesta</th>
                <th>Existe</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req, index) => {
                const { response, logResponse, logMessage } = req;
                const isValid = response.match;
                const isLogSuccess = logResponse?.status === 200;
                const isLogError = logResponse?.status === 400;

                return (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{req.dni}</td>
                    <td>{req.apellido}</td>
                    <td>{req.nombre}</td>
                    <td>
                      {isValid ? 'Usuario encontrado' : response.error || 'No encontrado'}
                    </td>
                    <td style={{ backgroundColor: isValid ? 'green' : '', color: 'white' }}>
                      {isValid ? 'Sí' : 'No'}
                    </td>
                    <td style={{ backgroundColor: isLogSuccess ? 'green' : isLogError ? 'red' : '', color: 'white' }}>
                      {isLogSuccess ? 'Ingresa' : isLogError ? logMessage || 'Error al registrar acción' : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Col>
      </Row>
    </>
  );
}

export default ScannerInput;
