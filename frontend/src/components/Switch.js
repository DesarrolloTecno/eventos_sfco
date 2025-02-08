import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Row, Col, Table } from 'react-bootstrap';
import axios from 'axios';
import { debounce } from 'lodash';
import entryStore from '../store/entryStore';

function Switch({ checked, setChecked }) {
    return (
        <>
            <Col xs={12} md={6}>
                <Form className="d-flex align-items-center justify-content-end">
                    <Form.Switch
                        id="entry-exit-switch"
                        label={checked === 1 ? 'Entrada' : 'Salida'}
                        checked={checked === 1 ? true : false}
                        onChange={e => {
                            console.log("CAMBIO DE INPUT", checked, e.target.checked)
                            setChecked(e.target.checked === true ? 1 : 0) }} // Cambia el estado `isEntry` al marcar/desmarcar
                        style={{ fontSize: '1.5rem', transform: 'scale(1.2)' }}
                    />
                </Form>
            </Col>
        </>
    )

}

export default Switch;
