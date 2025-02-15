import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/EventList.css';

function EventList() {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get('https://eventback-f6aiwsqjia-uc.a.run.app/api/events');
                setEvents(response.data);
            } catch (err) {
                console.error('Error fetching events:', err);
                setError('No se pudieron cargar los eventos.');
            }
        };

        fetchEvents();
    }, []);

    // Manejador de evento para navegar al scanner
    const handleSelectEvent = (eventId) => {
        navigate(`/scanner/${eventId}`);
    };

    return (
        <div className="event-list">
            <h1>Eventos Disponibles</h1>
            {error && <p className="error-message">{error}</p>}
            <ul>
                {events.map((event) => (
                    <li key={event.id} onClick={() => handleSelectEvent(event.id)}>
                        {event.nombre}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default EventList;
