import React from 'react';
import { Form } from 'react-bootstrap';

function EntryExitToggle({ isEntry, handleToggleEntryExit }) {
  return (
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
  );
}

export default EntryExitToggle;
