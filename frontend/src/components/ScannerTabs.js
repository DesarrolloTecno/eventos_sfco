import React, { useState } from 'react';
import { useParams } from 'react-router-dom';  // Importa useParams
import Scanner from './Scanner';
import '../styles/ScannerTabs.css';  // Importa el archivo de estilos
import Logs from './Logs'; // Importamos el nuevo componente para mostrar los ingresos/egresos.

const ScannerTabs = () => {
    const { eventId } = useParams();  // Extrae eventId de la URL

    const [activeTab, setActiveTab] = useState('scanner');

    console.log('Event ID:', eventId);  // Verifica si eventId es correcto

    return (
        <div>
            <div className="tabs">
                <button
                    className={activeTab === 'scanner' ? 'active' : ''}
                    onClick={() => setActiveTab('scanner')}
                >
                    Escaneo
                </button>
                <button
                    className={activeTab === 'logs' ? 'active' : ''}
                    onClick={() => setActiveTab('logs')}
                >
                    Ingresos/Egresos
                </button>
            </div>
            <div className="tab-content">
                {activeTab === 'scanner' && <Scanner eventId={eventId} />}
                {activeTab === 'logs' && <Logs eventId={eventId} />}
            </div>
        </div>
    );
};

export default ScannerTabs;
