import { Response } from 'express';
import { body, param, query } from 'express-validator';
import { AuthenticatedRequest } from '../types/index.js';
import { ticketService } from '../services/ticket.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';

/**
 * Validations pour la création d'un ticket
 */
export const createTicketValidation = [
  body('patientId')
    .notEmpty()
    .withMessage('L\'ID du patient est requis')
    .isUUID()
    .withMessage('ID patient invalide'),
  body('priority')
    .optional()
    .isIn(['NORMAL', 'ELDERLY', 'PREGNANT', 'DISABLED', 'EMERGENCY'])
    .withMessage('Priorité invalide'),
  body('priorityReason')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('La raison ne peut pas dépasser 255 caractères'),
];

/**
 * Validations pour la mise à jour du statut
 */
export const updateStatusValidation = [
  param('id').isUUID().withMessage('ID ticket invalide'),
  body('status')
    .notEmpty()
    .withMessage('Le statut est requis')
    .isIn(['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .withMessage('Statut invalide'),
];

/**
 * Contrôleur des tickets
 */
export class TicketController {
  /**
   * POST /api/tickets
   * Créer un nouveau ticket
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ticket = await ticketService.create(req.body);
      
      // Générer le QR code en base64
      const qrCodeImage = await ticketService.generateQRCodeImage(ticket.qrCode);
      
      // Estimer le temps d'attente
      const estimatedWaitTime = await ticketService.estimateWaitTime(
        ticket.queueEntry?.position || 1
      );

      sendSuccess(res, {
        ...ticket,
        qrCodeImage,
        estimatedWaitTime,
      }, 201, 'Ticket créé avec succès');
    } catch (error) {
      console.error('Erreur création ticket:', error);
      if (error instanceof Error && error.message === 'Patient non trouvé') {
        sendError(res, ErrorCodes.NOT_FOUND, 'Patient non trouvé', 404);
        return;
      }
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la création du ticket', 500);
    }
  }

  /**
   * GET /api/tickets/today
   * Tickets du jour
   */
  async getTodayTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      
      const [tickets, summary] = await Promise.all([
        ticketService.getTodayTickets(status as any),
        ticketService.getTodaySummary(),
      ]);

      sendSuccess(res, { tickets, summary });
    } catch (error) {
      console.error('Erreur tickets du jour:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération des tickets', 500);
    }
  }

  /**
   * GET /api/tickets/summary
   * Résumé des tickets du jour
   */
  async getTodaySummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const summary = await ticketService.getTodaySummary();
      sendSuccess(res, summary);
    } catch (error) {
      console.error('Erreur résumé tickets:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération du résumé', 500);
    }
  }

  /**
   * GET /api/tickets/:id
   * Détail d'un ticket
   */
  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ticket = await ticketService.findById(req.params.id);

      if (!ticket) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Ticket non trouvé', 404);
        return;
      }

      // Générer le QR code
      const qrCodeImage = await ticketService.generateQRCodeImage(ticket.qrCode);

      sendSuccess(res, { ...ticket, qrCodeImage });
    } catch (error) {
      console.error('Erreur détail ticket:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération du ticket', 500);
    }
  }

  /**
   * GET /api/tickets/qr/:qrCode
   * Rechercher un ticket par QR code
   */
  async findByQRCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ticket = await ticketService.findByQRCode(req.params.qrCode);

      if (!ticket) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Ticket non trouvé', 404);
        return;
      }

      sendSuccess(res, ticket);
    } catch (error) {
      console.error('Erreur recherche QR:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la recherche du ticket', 500);
    }
  }

  /**
   * PUT /api/tickets/:id/status
   * Mettre à jour le statut d'un ticket
   */
  async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ticket = await ticketService.findById(req.params.id);

      if (!ticket) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Ticket non trouvé', 404);
        return;
      }

      const updatedTicket = await ticketService.updateStatus(req.params.id, req.body.status);
      sendSuccess(res, updatedTicket, 200, 'Statut mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour du statut', 500);
    }
  }

  /**
   * POST /api/tickets/:id/cancel
   * Annuler un ticket
   */
  async cancel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const ticket = await ticketService.findById(req.params.id);

      if (!ticket) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Ticket non trouvé', 404);
        return;
      }

      if (ticket.status === 'COMPLETED' || ticket.status === 'CANCELLED') {
        sendError(res, ErrorCodes.VALIDATION_ERROR, 'Ce ticket ne peut pas être annulé', 400);
        return;
      }

      const cancelledTicket = await ticketService.cancel(req.params.id);
      sendSuccess(res, cancelledTicket, 200, 'Ticket annulé avec succès');
    } catch (error) {
      console.error('Erreur annulation ticket:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de l\'annulation du ticket', 500);
    }
  }

  /**
   * GET /api/tickets/verify/:qrCode
   * Vérifier un ticket par QR code (route publique)
   */
  async verifyByQRCode(req: any, res: Response): Promise<void> {
    try {
      const ticket = await ticketService.findByQRCode(req.params.qrCode);

      if (!ticket) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Ticket non trouvé ou invalide', 404);
        return;
      }

      // Vérifier la validité (10 jours)
      const ticketDate = new Date(ticket.createdAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24));
      const isValid = diffDays <= 10 && ticket.status !== 'CANCELLED';

      sendSuccess(res, {
        ticketNumber: ticket.ticketNumber,
        patient: {
          firstName: ticket.patient.firstName,
          lastName: ticket.patient.lastName,
        },
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        isValid,
        validUntil: new Date(ticketDate.getTime() + 10 * 24 * 60 * 60 * 1000),
        currentStation: ticket.queueEntry?.station || null,
        queuePosition: ticket.queueEntry?.position || null,
      });
    } catch (error) {
      console.error('Erreur vérification QR:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la vérification du ticket', 500);
    }
  }
}

export const ticketController = new TicketController();
