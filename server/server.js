const express = require('express');
const path = require('path');
require('dotenv').config();

const servicesRoutes = require('./routes/services');
const appointmentsRoutes = require('./routes/appointments');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/services', servicesRoutes);
app.use('/api/appointments', appointmentsRoutes);

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
    });

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
