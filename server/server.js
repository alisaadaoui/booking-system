const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const servicesRoutes = require('./routes/services');
const appointmentsRoutes = require('./routes/appointments');
const clientsRoutes = require('./routes/clients');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/services', servicesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/clients', clientsRoutes);

pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database connection failed:', err.message);
    });

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
