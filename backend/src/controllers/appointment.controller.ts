import { Response } from 'express';
import { body } from 'express-validator';
import prisma from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';

export const createAppointmentValidation = [
  body('patientId').isUUID().withMessage('ID patient invalide'),
  body('scheduledDate').isISO8601().withMessage('Date invalide'),
  body('scheduledTime').matches(/^\d{2}:\d{2}$/).withMessage('Heure invalide (format HH:MM)'),
  body('reason').optional().trim(),
  body('notes').optional().trim(),
];

export const updateAppointmentValidation = [
  body('status').optional().isIn(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  body('scheduledDate').optional().isISO8601(),
  body('scheduledTime').optional().matches(/^\d{2}:\d{2}$/),
  body('reason').optional().trim(),
  body('notes').optional().trim(),
];

export class AppointmentController {
  /**
   * GET /api/appointments
   * Liste des rendez-vous (par date ou période)
   */
  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { date, startDate, endDate, status, upcoming } = req.query;

      let where: any = {};

      // Récupérer les RDV à venir (à partir d'aujourd'hui)
      if (upcoming === 'true') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        where.scheduledDate = { gte: today };
        where.status = { notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW'] };
      }
      // Filtrer par date unique
      else if (date) {
        // Chercher les RDV dont la date correspond (en ignorant l'heure)
        const dateStr = date as string; // format YYYY-MM-DD
        // Créer une plage large pour capturer toutes les heures possibles
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        startOfDay.setHours(startOfDay.getHours() - 12); // 12h avant pour couvrir tous les fuseaux
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
        endOfDay.setHours(endOfDay.getHours() + 12); // 12h après pour couvrir tous les fuseaux
        where.scheduledDate = { gte: startOfDay, lte: endOfDay };
      }
      // Filtrer par période
      else if (startDate && endDate) {
        where.scheduledDate = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      // Filtrer par statut (si pas déjà défini par upcoming)
      if (status && !where.status) {
        where.status = status;
      }

      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              dateOfBirth: true,
            },
          },
        },
        orderBy: [
          { scheduledDate: 'asc' },
          { scheduledTime: 'asc' },
        ],
      });

      sendSuccess(res, appointments);
    } catch (error) {
      console.error('Erreur liste rendez-vous:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération des rendez-vous', 500);
    }
  }

  /**
   * GET /api/appointments/:id
   * Détail d'un rendez-vous
   */
  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: req.params.id },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              dateOfBirth: true,
              address: true,
            },
          },
        },
      });

      if (!appointment) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Rendez-vous non trouvé', 404);
        return;
      }

      sendSuccess(res, appointment);
    } catch (error) {
      console.error('Erreur détail rendez-vous:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération du rendez-vous', 500);
    }
  }

  /**
   * POST /api/appointments
   * Créer un rendez-vous
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { patientId, scheduledDate, scheduledTime, reason, notes } = req.body;

      // Vérifier que le patient existe
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Patient non trouvé', 404);
        return;
      }

      // Vérifier qu'il n'y a pas déjà un rendez-vous à cette heure
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          scheduledDate: new Date(scheduledDate),
          scheduledTime,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      });

      if (existingAppointment) {
        sendError(res, ErrorCodes.CONFLICT, 'Un rendez-vous existe déjà à cette heure', 409);
        return;
      }

      // Créer la date en UTC pour éviter les problèmes de timezone
      const dateOnly = new Date(`${scheduledDate}T12:00:00.000Z`);
      
      const appointment = await prisma.appointment.create({
        data: {
          patientId,
          scheduledDate: dateOnly,
          scheduledTime,
          reason: reason || 'Consultation',
          notes,
          status: 'SCHEDULED',
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      sendSuccess(res, appointment, 201, 'Rendez-vous créé avec succès');
    } catch (error) {
      console.error('Erreur création rendez-vous:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la création du rendez-vous', 500);
    }
  }

  /**
   * PUT /api/appointments/:id
   * Mettre à jour un rendez-vous
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, scheduledDate, scheduledTime, reason, notes } = req.body;

      const existing = await prisma.appointment.findUnique({ where: { id } });
      if (!existing) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Rendez-vous non trouvé', 404);
        return;
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
      if (scheduledTime) updateData.scheduledTime = scheduledTime;
      if (reason !== undefined) updateData.reason = reason;
      if (notes !== undefined) updateData.notes = notes;

      const appointment = await prisma.appointment.update({
        where: { id },
        data: updateData,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      sendSuccess(res, appointment, 200, 'Rendez-vous mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour rendez-vous:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour du rendez-vous', 500);
    }
  }

  /**
   * DELETE /api/appointments/:id
   * Supprimer un rendez-vous
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const existing = await prisma.appointment.findUnique({ where: { id } });
      if (!existing) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Rendez-vous non trouvé', 404);
        return;
      }

      await prisma.appointment.delete({ where: { id } });

      sendSuccess(res, null, 200, 'Rendez-vous supprimé');
    } catch (error) {
      console.error('Erreur suppression rendez-vous:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la suppression du rendez-vous', 500);
    }
  }

  /**
   * GET /api/appointments/today
   * Rendez-vous du jour
   */
  async getToday(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      const appointments = await prisma.appointment.findMany({
        where: {
          scheduledDate: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: { scheduledTime: 'asc' },
      });

      // Statistiques
      const stats = {
        total: appointments.length,
        scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
        confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
        completed: appointments.filter(a => a.status === 'COMPLETED').length,
        cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
        noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
      };

      sendSuccess(res, { appointments, stats });
    } catch (error) {
      console.error('Erreur rendez-vous du jour:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération des rendez-vous', 500);
    }
  }

  /**
   * GET /api/appointments/patient/:patientId
   * Rendez-vous d'un patient
   */
  async getByPatient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;

      const appointments = await prisma.appointment.findMany({
        where: { patientId },
        orderBy: { scheduledDate: 'desc' },
      });

      sendSuccess(res, appointments);
    } catch (error) {
      console.error('Erreur rendez-vous patient:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération des rendez-vous', 500);
    }
  }
}

export const appointmentController = new AppointmentController();
