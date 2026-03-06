import { Response } from 'express';
import { body, param } from 'express-validator';
import { AuthenticatedRequest } from '../types/index.js';
import { orderService } from '../services/order.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';

export const createOrderValidation = [
  body('station').isIn(['ACCUEIL', 'TEST_VUE', 'CONSULTATION', 'LUNETTES', 'MEDICAMENTS', 'BLOC_OPERATOIRE']).withMessage('Station invalide'),
  body('priority').optional().isIn(['NORMAL', 'ELDERLY', 'PREGNANT', 'DISABLED', 'EMERGENCY']),
  body('neededByDate').optional().isISO8601(),
  body('notes').optional().trim(),
  body('items').isArray({ min: 1 }).withMessage('Au moins un article requis'),
  body('items.*.itemName').trim().notEmpty().withMessage('Nom article requis'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('items.*.description').optional().trim(),
  body('items.*.unit').optional().trim(),
  body('items.*.notes').optional().trim(),
];

export const updateOrderValidation = [
  param('id').isUUID().withMessage('ID invalide'),
  body('priority').optional().isIn(['NORMAL', 'ELDERLY', 'PREGNANT', 'DISABLED', 'EMERGENCY']),
  body('neededByDate').optional().isISO8601(),
  body('notes').optional().trim(),
];

export class OrderController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const order = await orderService.create({
        ...req.body,
        requestedBy: req.user!.id,
      });
      sendSuccess(res, order, 201, 'Commande créée');
    } catch (error) {
      console.error('Erreur création commande:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la création', 500);
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        station: req.query.station as any,
        status: req.query.status as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const orders = await orderService.findAll(filters);
      sendSuccess(res, orders);
    } catch (error) {
      console.error('Erreur liste commandes:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const order = await orderService.findById(req.params.id);
      if (!order) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Commande non trouvée', 404);
        return;
      }
      sendSuccess(res, order);
    } catch (error) {
      console.error('Erreur détail commande:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const order = await orderService.update(req.params.id, req.body);
      sendSuccess(res, order, 200, 'Commande mise à jour');
    } catch (error) {
      console.error('Erreur mise à jour commande:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour', 500);
    }
  }

  async submit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const order = await orderService.submit(req.params.id);
      sendSuccess(res, order, 200, 'Commande soumise');
    } catch (error) {
      console.error('Erreur soumission commande:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la soumission', 500);
    }
  }

  async approve(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const order = await orderService.approve(req.params.id, req.user!.id);
      sendSuccess(res, order, 200, 'Commande approuvée');
    } catch (error) {
      console.error('Erreur approbation commande:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de l\'approbation', 500);
    }
  }

  async complete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const order = await orderService.complete(req.params.id);
      sendSuccess(res, order, 200, 'Commande complétée');
    } catch (error) {
      console.error('Erreur completion commande:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la complétion', 500);
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const order = await orderService.cancel(req.params.id);
      sendSuccess(res, order, 200, 'Commande annulée');
    } catch (error) {
      console.error('Erreur annulation commande:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de l\'annulation', 500);
    }
  }

  async addItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const item = await orderService.addItem(req.params.id, req.body);
      sendSuccess(res, item, 201, 'Article ajouté');
    } catch (error) {
      console.error('Erreur ajout article:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de l\'ajout', 500);
    }
  }

  async removeItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await orderService.removeItem(req.params.itemId);
      sendSuccess(res, null, 200, 'Article supprimé');
    } catch (error) {
      console.error('Erreur suppression article:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la suppression', 500);
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await orderService.getStats(startDate, endDate);
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Erreur stats commandes:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }
}

export const orderController = new OrderController();
