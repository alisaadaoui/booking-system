const db = require('../config/database');

// Get all clients
exports.getAllClients = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM clients ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

// Get single client
exports.getClientById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
};

// Create client
exports.createClient = async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        
        // Check if client with phone already exists
        const [existing] = await db.query('SELECT id FROM clients WHERE phone = ?', [phone]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Client with this phone number already exists' });
        }
        
        const [result] = await db.query(
            'INSERT INTO clients (name, email, phone) VALUES (?, ?, ?)',
            [name, email || null, phone]
        );
        
        res.status(201).json({ 
            id: result.insertId, 
            name, 
            email, 
            phone,
            message: 'Client created successfully' 
        });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
};

// Update client
exports.updateClient = async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        const [result] = await db.query(
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
};

// Delete client
exports.deleteClient = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM clients WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
};
