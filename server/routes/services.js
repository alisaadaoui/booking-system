const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all services
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM services ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

// Get single service
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(500).json({ error: 'Failed to fetch service' });
    }
});

// Create new service
router.post('/', async (req, res) => {
    try {
        const { name, duration, price } = req.body;
        const [result] = await pool.query(
            'INSERT INTO services (name, duration, price) VALUES (?, ?, ?)',
            [name, duration, price]
        );
        res.status(201).json({ id: result.insertId, message: 'Service created successfully' });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ error: 'Failed to create service' });
    }
});

// Update service
router.put('/:id', async (req, res) => {
    try {
        const { name, duration, price } = req.body;
        const [result] = await pool.query(
            'UPDATE services SET name = ?, duration = ?, price = ? WHERE id = ?',
            [name, duration, price, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json({ message: 'Service updated successfully' });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Failed to update service' });
    }
});

// Delete service
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM services WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

module.exports = router;