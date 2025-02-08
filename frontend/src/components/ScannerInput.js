import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Row, Col, Table } from 'react-bootstrap';
import axios from 'axios';
import { debounce } from 'lodash';

function ScannerInput({ eventId, isEntry, handleToggleEntryExit, setDecodedInfo, setUserInfo, setErrorMessage, setSuccessMessage }) {
  const [inputData, setInputData] = useState('');
  const [requests, setRequests] = useState([]);
  const [isError, setIsError] = useState(false); // Estado para manejar el error
  const inputRef = useRef(null);

  const validateDNI = async (dni) => {
    try {
      const validateResponse = await axios.post(`http://localhost:5000/api/validate/${eventId}`, { dni });
      const responseData = validateResponse.data;

      let logResponse = null;
      let logMessage = '';

      if (responseData.match) {
        // Usuario encontrado, registrar en la base de logs
        const user = responseData.user;
        setUserInfo({
          nombre: user.usuario,
          rol: user.rol,
          color: user.color,
        });

        setSuccessMessage(`¡Ingreso/Salida Registrado Exitosamente! \nNombre: ${user.usuario} \nRol: ${user.rol}`);

        // Determinar el estado según el interruptor de entrada/salida
        const estado = isEntry ? 1 : 0; // Aquí validamos el estado del interruptor

        // Registrar log de ingreso/salida con el estado correcto
        logResponse = await sendLogRequest(eventId, user.id_usuario, estado);
        logMessage = logResponse?.data?.message || '';
      } else {
        setErrorMessage(responseData.message);
        setIsError(true); // Set error state
        alert(responseData.message); // Show alert with the error message
      }

      setRequests(prevRequests => [
        ...prevRequests, 
        { dni, response: responseData, logResponse, logMessage }
      ]);

      // Limpiar el input después de procesar la respuesta del log
      setInputData('');

    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error al conectar con el servidor.';
      setErrorMessage(errorMsg);
      setIsError(true); // Set error state
      setRequests(prevRequests => [
        ...prevRequests, 
        { dni, response: { error: errorMsg } }
      ]);

      // Limpiar el input en caso de error
      setInputData('');
    }
  };

  const debouncedValidateDNI = useCallback(debounce(validateDNI, 500), []);

  const handleInputChange = (e) => {
    const input = e.target.value;
    setInputData(input);

    if (input.length > 0) {
      try {
        const parsedData = parseData(input);
        setDecodedInfo(parsedData);

        if (!parsedData.numDocumento) return;

        debouncedValidateDNI(parsedData.numDocumento);
      } catch (error) {
        setErrorMessage('Error al procesar los datos.');
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
      return await axios.post(`http://localhost:5000/api/log/${eventId}`, { userId, estado });
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
          <Form className="d-flex align-items-center justify-content-end">
            <Form.Check
              type="checkbox"
              id="entry-exit-checkbox"
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
      </Row>

      <Row className="mt-4">
        <Col>
          <Table
            striped
            bordered
            hover
            style={{
              backgroundColor: isError ? 'red' : '',
              color: isError ? 'white' : '',
              fontWeight: isError ? 'bold' : '',
            }}
          >
            <thead>
              <tr>
                <th>#</th>
                <th>DNI</th>
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
                    <td>
                      {isValid
                        ? 'Usuario encontrado'
                        : response.error || 'No encontrado'}
                    </td>
                    <td
                      style={{
                        backgroundColor: isValid ? 'green' : '',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {isValid ? 'Sí' : 'No'}
                    </td>
                    <td
                      style={{
                        backgroundColor: isLogSuccess
                          ? 'green'
                          : isLogError
                          ? 'red'
                          : '',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {isLogSuccess
                        ? 'Ingresa'
                        : isLogError
                        ? logMessage || 'Error al registrar acción'
                        : ''}
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
