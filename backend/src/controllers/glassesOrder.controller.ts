import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { glassesOrderService } from '../services/glassesOrder.service';

export const glassesOrderValidation = {
  create: [
    body('patientId').isUUID().withMessage('ID patient invalide'),
    body('consultationId').isUUID().withMessage('ID consultation invalide'),
    body('odSphere').optional().isFloat().withMessage('Sphère OD invalide'),
    body('odCylinder').optional().isFloat().withMessage('Cylindre OD invalide'),
    body('odAxis').optional().isInt({ min: 0, max: 180 }).withMessage('Axe OD invalide'),
    body('odAddition').optional().isFloat().withMessage('Addition OD invalide'),
    body('ogSphere').optional().isFloat().withMessage('Sphère OG invalide'),
    body('ogCylinder').optional().isFloat().withMessage('Cylindre OG invalide'),
    body('ogAxis').optional().isInt({ min: 0, max: 180 }).withMessage('Axe OG invalide'),
    body('ogAddition').optional().isFloat().withMessage('Addition OG invalide'),
    body('lensType').optional().isString(),
    body('coating').optional().isString(),
    body('frameType').optional().isString(),
    body('frameReference').optional().isString(),
    body('pupillaryDistance').optional().isFloat(),
    body('priority').optional().isIn(['NORMAL', 'EMERGENCY', 'ELDERLY', 'PREGNANT', 'DISABLED']),
    body('estimatedDate').optional().isISO8601(),
    body('notes').optional().isString(),
  ],
  update: [
    param('id').isUUID().withMessage('ID commande invalide'),
    body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED']),
    body('lensType').optional().isString(),
    body('coating').optional().isString(),
    body('frameType').optional().isString(),
    body('frameReference').optional().isString(),
    body('pupillaryDistance').optional().isFloat(),
    body('estimatedDate').optional().isISO8601(),
    body('workshopNotes').optional().isString(),
    body('notes').optional().isString(),
  ],
};

class GlassesOrderController {
  // Créer une commande
  async create(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: { message: errors.array()[0].msg } });
    }

    try {
      const userId = (req as any).user?.id;
      const order = await glassesOrderService.create(req.body, userId);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      console.error('Erreur création commande lunettes:', error);
      res.status(500).json({ success: false, error: { message: 'Erreur serveur' } });
    }
  }

  // Récupérer toutes les commandes
  async getAll(req: Request, res: Response) {
    try {
      const { status, patientId, fromDate, toDate } = req.query;
      const orders = await glassesOrderService.getAll({
        status: status as any,
        patientId: patientId as string,
        fromDate: fromDate as string,
        toDate: toDate as string,
      });
      res.json({ success: true, data: orders });
    } catch (error) {
      console.error('Erreur récupération commandes:', error);
      res.status(500).json({ success: false, error: { message: 'Erreur serveur' } });
    }
  }

  // Récupérer les commandes en attente (atelier)
  async getPending(req: Request, res: Response) {
    try {
      const orders = await glassesOrderService.getPending();
      res.json({ success: true, data: orders });
    } catch (error) {
      console.error('Erreur récupération commandes en attente:', error);
      res.status(500).json({ success: false, error: { message: 'Erreur serveur' } });
    }
  }

  // Récupérer les commandes prêtes
  async getReady(req: Request, res: Response) {
    try {
      const orders = await glassesOrderService.getReady();
      res.json({ success: true, data: orders });
    } catch (error) {
      console.error('Erreur récupération commandes prêtes:', error);
      res.status(500).json({ success: false, error: { message: 'Erreur serveur' } });
    }
  }

  // Récupérer une commande par ID
  async getById(req: Request, res: Response) {
    try {
      const order = await glassesOrderService.getById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, error: { message: 'Commande non trouvée' } });
      }
      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Erreur récupération commande:', error);
      res.status(500).json({ success: false, error: { message: 'Erreur serveur' } });
    }
  }

  // Mettre à jour une commande
  async update(req: Request, res: Response) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: { message: errors.array()[0].msg } });
    }

    try {
      const order = await glassesOrderService.update(req.params.id, req.body);
      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Erreur mise à jour commande:', error);
      res.status(500).json({ success: false, error: { message: 'Erreur serveur' } });
    }
  }

  // Démarrer la fabrication
  async startProgress(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const order = await glassesOrderService.startProgress(req.params.id, userId);
      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Erreur démarrage fabrication:', error);
      res.status(500).json({ success: false, error: { message: 'Erreur serveur' } });
    }
  }

  // Marquer comme prêt
  async markReady(req: Request, res: Response) {
    try {
      const { workshopNotes } = req.body;
      const order = await glassesOrderService.markReady(req.params.id, workshopNotes);
      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Erreur marquage prêt:', error);
      res.status(500).json({ success: false, error: { message: 'Erreur serveur' } });
    }
  }

  // Marquer comme livré
  async markDelivered(req: Request, res: Response) {
    try {
      const order = await glassesOrderService.markDelivered(req.params.id);
      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Erreur marquage livré:', error);
      res.status(500).json({ success: false, error: { message: 'Erreur serveur' } });
    }
  }

  // Annuler une commande
  async cancel(req: Request, res: Response) {
    try {
      const { reason } = req.body;
      const order = await glassesOrderService.cancel(req.params.id, reason);
      res.json({ success: true, data: order });
    } catch (error) {
      console.error('Erreur annulation commande:', error);
      res.status(500).json({ success: false, error: { message: 'Erreur serveur' } });
    }
  }

  // Statistiques
  async getStats(req: Request, res: Response) {
    try {
      const stats = await glassesOrderService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Erreur statistiques:', error);
      res.status(500).json({ success: false, error: { message: 'Erreur serveur' } });
    }
  }

  // Commandes d'un patient
  async getByPatient(req: Request, res: Response) {
    try {
      const orders = await glassesOrderService.getByPatient(req.params.patientId);
      res.json({ success: true, data: orders });
    } catch (error) {
      console.error('Erreur récupération commandes patient:', error);
      res.status(500).json({ success: false, error: { message: 'Erreur serveur' } });
    }
  }
}

export const glassesOrderController = new GlassesOrderController();
