const express = require('express');
const router = express.Router();
const { 
    getAllAppointments, 
    createAppointment, 
    updateAppointmentStatus, 
    deleteAppointment 
} = require('../controllers/appointmentsController');

router.get('/', getAllAppointments);
router.post('/', createAppointment);
router.patch('/:id', updateAppointmentStatus);
router.delete('/:id', deleteAppointment);

module.exports = router;