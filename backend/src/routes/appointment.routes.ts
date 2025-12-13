import { Router } from 'express';
import { appointmentController, createAppointmentValidation, updateAppointmentValidation } from '../controllers/appointment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes
router.get('/', appointmentController.findAll);
router.get('/today', appointmentController.getToday);
router.get('/patient/:patientId', appointmentController.getByPatient);
router.get('/:id', appointmentController.findById);
router.post('/', validate(createAppointmentValidation), appointmentController.create);
router.put('/:id', validate(updateAppointmentValidation), appointmentController.update);
router.delete('/:id', appointmentController.delete);

export default router;
