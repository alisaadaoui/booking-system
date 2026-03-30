const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all clients
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clients ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// Get single client
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
});

// Create client
router.post('/', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        
        const [existing] = await pool.query('SELECT id FROM clients WHERE phone = ?', [phone]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Client with this phone number already exists' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)',
            [name, email || null, phone]
        );
        
        res.status(201).json({ id: result.insertId, name, email, phone, message: 'Client created successfully' });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// Update client
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const [result] = await pool.query(
            'UPDATE clients SET name = ?, email = ?, phone = ? WHERE id = ?',
            [name, email || null, phone, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json({ message: 'Client updated successfully' });
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// Delete client
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

module.exports = router;
