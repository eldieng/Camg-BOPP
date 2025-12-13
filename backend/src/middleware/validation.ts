import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { sendError, ErrorCodes } from '../utils/response.js';
import { ValidationError } from '../types/index.js';

/**
 * Middleware de validation
 * Exécute les validations et retourne les erreurs si présentes
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Exécuter toutes les validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      next();
      return;
    }

    // Formater les erreurs
    const formattedErrors: ValidationError[] = errors.array().map((error) => ({
      field: 'path' in error ? error.path : 'unknown',
      message: error.msg,
    }));

    sendError(
      res,
      ErrorCodes.VALIDATION_ERROR,
      'Les données fournies sont invalides',
      400,
      formattedErrors
    );
  };
}
