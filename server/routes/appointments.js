const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all appointments
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.*, 
                   DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date,
                   s.name as service_name, s.duration, s.price, s.color
            FROM appointments a 
            JOIN services s ON a.service_id = s.id 
            ORDER BY a.appointment_date DESC, a.appointment_time ASC
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Create appointment + auto-create client if new
router.post('/', async (req, res) => {
    try {
        const { customer_name, customer_phone, customer_email, service_id, appointment_date, appointment_time } = req.body;
        
        // Check for double-booking
        const [existing] = await pool.query(
            `SELECT * FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND status != 'cancelled'`,
            [appointment_date, appointment_time]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'This time slot is already booked' });
        }
        
        // Auto-create client if they don't exist
        const [existingClient] = await pool.query('SELECT id FROM clients WHERE phone = ?', [customer_phone]);
        if (existingClient.length === 0) {
            await pool.query(
                'INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)',
                [customer_name, customer_email || null, customer_phone]
            );
        }
        
        // Create the appointment
        const [result] = await pool.query(
            `INSERT INTO appointments (customer_name, customer_phone, service_id, appointment_date, appointment_time) VALUES (?, ?, ?, ?, ?)`,
            [customer_name, customer_phone, service_id, appointment_date, appointment_time]
        );
        
        res.status(201).json({ id: result.insertId, message: 'Appointment booked successfully' });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
});

// Update appointment status
router.patch('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const [result] = await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json({ message: 'Appointment updated successfully' });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Failed to update appointment' });
    }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM appointments WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ error: 'Failed to delete appointment' });
    }
});

module.exports = router;
