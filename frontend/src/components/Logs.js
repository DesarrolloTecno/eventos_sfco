import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Spinner, Alert, Container, Form, Row, Col, Button, Pagination } from 'react-bootstrap';

const Logs = ({ eventId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        date: '',
        estado: '',
        usuario: '',
    });
    const [currentPage, setCurrentPage] = useState(1); // Página actual
    const [logsPerPage] = useState(50); // Registros por página

    // Función para formatear la fecha
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const fetchLogs = () => {
        setLoading(true);
        setError('');

        let queryParams = [];
        if (filters.date) queryParams.push(`date=${filters.date}`);
        if (filters.estado) queryParams.push(`estado=${filters.estado}`);
        if (filters.usuario) queryParams.push(`usuario=${filters.usuario}`);

        const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';

        axios.get(`http://localhost:5000/api/events/${eventId}/logs${queryString}`)
            .then(response => {
                if (response.data.length === 0) {
                    setError('No se encontraron registros para este evento con los filtros aplicados.');
                    setLogs([]);
                } else {
                    setLogs(response.data);
                }
            })
            .catch(err => {
                console.error('Error al obtener los registros:', err);
                setError('Error al obtener los registros');
                setLogs([]);
            })
            .finally(() => setLoading(false));
    };

    // Llamar a fetchLogs cuando cambien los filtros o el evento
    useEffect(() => {
        if (eventId) {
            fetchLogs();
        } else {
            setError('Evento no válido');
            setLoading(false);
        }
    }, [filters, eventId]);

    // Función para limpiar los filtros correctamente
    const clearFilters = () => {
        setFilters({
            date: '',
            estado: '',
            usuario: '',
        });
    };

    // Determina los logs que deben mostrarse en la página actual
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);

    // Paginación
    const totalPages = Math.ceil(logs.length / logsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <Container className="mt-3">
            <h2 className="text-center">📜 Registros</h2>

            {/* Filtros */}
            <Form className="mb-3">
                <Row className="align-items-end">
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label>Fecha</Form.Label>
                            <Form.Control
                                type="date"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label>Estado</Form.Label>
                            <Form.Select
                                value={filters.estado}
                                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                            >
                                <option value="">Todos</option>
                                <option value="1">✅ Ingreso</option>
                                <option value="0">🚪 Egreso</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label>Usuario</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nombre del usuario"
                                value={filters.usuario}
                                onChange={(e) => setFilters({ ...filters, usuario: e.target.value })}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3} className="d-flex gap-2">
                        <Button onClick={fetchLogs} className="w-50">Filtrar</Button>
                        <Button variant="secondary" onClick={clearFilters} className="w-50">Limpiar</Button>
                    </Col>
                </Row>
            </Form>

            {loading && <Spinner animation="border" className="d-block mx-auto" />}

            {error && <Alert variant="danger" className="text-center">{error}</Alert>}

            {!loading && currentLogs.length > 0 && (
                <>
                    <Table striped bordered hover responsive className="mt-3">
                        <thead className="table-dark">
                            <tr>
                                <th>#</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Usuario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentLogs.map((log, index) => (
                                <tr key={log.id_logs}>
                                    <td>{index + 1}</td>
                                    <td>{formatDate(log.fecha)}</td>
                                    <td>{log.estado === 1 ? "✅ Ingreso" : "🚪 Egreso"}</td>
                                    <td>{log.usuario}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {/* Paginación */}
                    <Pagination>
                        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                        {[...Array(totalPages)].map((_, index) => (
                            <Pagination.Item
                                key={index + 1}
                                active={index + 1 === currentPage}
                                onClick={() => handlePageChange(index + 1)}
                            >
                                {index + 1}
                            </Pagination.Item>
                        ))}
                        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                    </Pagination>
                </>
            )}

            {!loading && logs.length === 0 && (
                <Alert variant="warning" className="text-center">No hay registros aún.</Alert>
            )}
        </Container>
    );
};

export default Logs;
