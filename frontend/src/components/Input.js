import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form, Row, Col, Table } from 'react-bootstrap';
import axios from 'axios';
import { debounce } from 'lodash';
import entryStore from '../store/entryStore';


function Input({ inputData, handleInputChange, inputRef }) {
    return (
        <>
            <Col xs={12} md={6}>
                <Form.Control
                    id='inputScanner'
                    type="text"
                    value={inputData}
                    onChange={handleInputChange}
                    placeholder="Escanea el código aquí"
                    ref={inputRef}
                />
            </Col>
        </>
    )

}

export default Input;
