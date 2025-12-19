import prisma from '../lib/prisma.js';

export type AuditAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'PATIENT_CREATE'
  | 'PATIENT_UPDATE'
  | 'PATIENT_DELETE'
  | 'TICKET_CREATE'
  | 'APPOINTMENT_CREATE'
  | 'APPOINTMENT_UPDATE'
  | 'QUEUE_CALL'
  | 'QUEUE_COMPLETE'
  | 'CONSULTATION_CREATE';

interface AuditLogData {
  action: AuditAction;
  userId?: string;
  entityId?: string;
  entity?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

class AuditLogService {
  /**
   * Enregistrer une action dans les logs d'audit
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          userId: data.userId,
          entityId: data.entityId,
          entity: data.entity || 'SYSTEM',
          details: data.details,
          ipAddress: data.ipAddress,
        },
      });
    } catch (error) {
      // Ne pas faire échouer l'action principale si le log échoue
      console.error('[AuditLog] Erreur lors de l\'enregistrement:', error);
    }
  }

  /**
   * Récupérer les logs d'audit avec filtres
   */
  async getLogs(filters: {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
        skip: filters.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Récupérer les logs d'un utilisateur spécifique
   */
  async getUserLogs(userId: string, limit: number = 50) {
    return this.getLogs({ userId, limit });
  }

  /**
   * Récupérer les tentatives de connexion échouées
   */
  async getFailedLogins(hours: number = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return prisma.auditLog.findMany({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const auditLog = new AuditLogService();
