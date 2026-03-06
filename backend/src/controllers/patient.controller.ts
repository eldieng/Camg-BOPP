import { Response } from 'express';
import { body, param, query } from 'express-validator';
import { AuthenticatedRequest } from '../types/index.js';
import { patientService } from '../services/patient.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';

/**
 * Validations pour la création d'un patient
 */
export const createPatientValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('Le prénom est requis')
    .isLength({ max: 100 })
    .withMessage('Le prénom ne peut pas dépasser 100 caractères'),
  body('isVIP')
    .optional()
    .isBoolean()
    .withMessage('isVIP doit être un booléen'),
  body('vipReason')
    .optional()
    .trim(),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ max: 100 })
    .withMessage('Le nom ne peut pas dépasser 100 caractères'),
  body('dateOfBirth')
    .notEmpty()
    .withMessage('La date de naissance est requise')
    .isISO8601()
    .withMessage('Format de date invalide')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (date > today) {
        throw new Error('La date de naissance ne peut pas être dans le futur');
      }
      const minDate = new Date('1900-01-01');
      if (date < minDate) {
        throw new Error('La date de naissance ne peut pas être avant 1900');
      }
      return true;
    }),
  body('gender')
    .notEmpty()
    .withMessage('Le genre est requis')
    .isIn(['MALE', 'FEMALE'])
    .withMessage('Genre invalide'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('L\'adresse ne peut pas dépasser 255 caractères'),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s+()-]*$/)
    .withMessage('Format de téléphone invalide'),
  body('emergencyContact')
    .optional()
    .trim(),
  body('isPregnant')
    .optional()
    .isBoolean()
    .withMessage('isPregnant doit être un booléen'),
  body('isDisabled')
    .optional()
    .isBoolean()
    .withMessage('isDisabled doit être un booléen'),
  body('notes')
    .optional()
    .trim(),
];

/**
 * Validations pour la mise à jour d'un patient
 */
export const updatePatientValidation = [
  param('id').isUUID().withMessage('ID patient invalide'),
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Le prénom ne peut pas être vide')
    .isLength({ max: 100 }),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Le nom ne peut pas être vide')
    .isLength({ max: 100 }),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Format de date invalide'),
  body('gender')
    .optional()
    .isIn(['MALE', 'FEMALE'])
    .withMessage('Genre invalide'),
  body('address').optional().trim(),
  body('phone').optional().trim(),
  body('emergencyContact').optional().trim(),
  body('isPregnant').optional().isBoolean(),
  body('isDisabled').optional().isBoolean(),
  body('isVIP').optional().isBoolean(),
  body('vipReason').optional().trim(),
  body('notes').optional().trim(),
];

/**
 * Validations pour la mise à jour du statut VIP
 */
export const updateVIPValidation = [
  param('id').isUUID().withMessage('ID patient invalide'),
  body('isVIP')
    .isBoolean()
    .withMessage('isVIP est requis et doit être un booléen'),
  body('vipReason')
    .optional()
    .trim(),
];

/**
 * Validations pour la recherche
 */
export const searchPatientValidation = [
  query('search').optional().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isIn(['firstName', 'lastName', 'createdAt', 'dateOfBirth']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];

/**
 * Contrôleur des patients
 */
export class PatientController {
  /**
   * POST /api/patients
   * Créer un nouveau patient
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const patient = await patientService.create(req.body);
      sendSuccess(res, patient, 201, 'Patient créé avec succès');
    } catch (error) {
      console.error('Erreur création patient:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la création du patient', 500);
    }
  }

  /**
   * GET /api/patients
   * Liste des patients avec pagination et recherche
   */
  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const params = {
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await patientService.findAll(params);
      sendSuccess(res, result);
    } catch (error) {
      console.error('Erreur liste patients:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération des patients', 500);
    }
  }

  /**
   * GET /api/patients/search
   * Recherche rapide (autocomplete)
   */
  async quickSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;

      const patients = await patientService.quickSearch(query, limit);
      sendSuccess(res, patients);
    } catch (error) {
      console.error('Erreur recherche patients:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la recherche', 500);
    }
  }

  /**
   * GET /api/patients/:id
   * Détail d'un patient
   */
  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const patient = await patientService.findById(req.params.id);

      if (!patient) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Patient non trouvé', 404);
        return;
      }

      // Ajouter l'âge calculé
      const patientWithAge = {
        ...patient,
        age: patientService.calculateAge(patient.dateOfBirth),
      };

      sendSuccess(res, patientWithAge);
    } catch (error) {
      console.error('Erreur détail patient:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération du patient', 500);
    }
  }

  /**
   * GET /api/patients/:id/history
   * Historique médical complet d'un patient
   */
  async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const patient = await patientService.findByIdWithHistory(req.params.id);

      if (!patient) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Patient non trouvé', 404);
        return;
      }

      sendSuccess(res, patient);
    } catch (error) {
      console.error('Erreur historique patient:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération de l\'historique', 500);
    }
  }

  /**
   * PUT /api/patients/:id
   * Mettre à jour un patient
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const existingPatient = await patientService.findById(req.params.id);

      if (!existingPatient) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Patient non trouvé', 404);
        return;
      }

      const patient = await patientService.update(req.params.id, req.body);
      sendSuccess(res, patient, 200, 'Patient mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour patient:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour du patient', 500);
    }
  }

  /**
   * DELETE /api/patients/:id
   * Supprimer un patient
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const existingPatient = await patientService.findById(req.params.id);

      if (!existingPatient) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Patient non trouvé', 404);
        return;
      }

      await patientService.delete(req.params.id);
      sendSuccess(res, null, 200, 'Patient supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression patient:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la suppression du patient', 500);
    }
  }

  /**
   * GET /api/patients/registration/:registrationNumber
   * Rechercher un patient par numéro d'immatriculation
   */
  async findByRegistrationNumber(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const patient = await patientService.findByRegistrationNumber(req.params.registrationNumber);

      if (!patient) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Patient non trouvé', 404);
        return;
      }

      const patientWithAge = {
        ...patient,
        age: patientService.calculateAge(patient.dateOfBirth),
      };

      sendSuccess(res, patientWithAge);
    } catch (error) {
      console.error('Erreur recherche par immatriculation:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la recherche', 500);
    }
  }

  /**
   * PATCH /api/patients/:id/vip
   * Mettre à jour le statut VIP d'un patient
   */
  async updateVIPStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const existingPatient = await patientService.findById(req.params.id);

      if (!existingPatient) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Patient non trouvé', 404);
        return;
      }

      const { isVIP, vipReason } = req.body;
      const patient = await patientService.updateVIPStatus(req.params.id, isVIP, vipReason);
      
      sendSuccess(res, patient, 200, isVIP ? 'Patient marqué VIP' : 'Statut VIP retiré');
    } catch (error) {
      console.error('Erreur mise à jour VIP:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour du statut VIP', 500);
    }
  }
}

export const patientController = new PatientController();
