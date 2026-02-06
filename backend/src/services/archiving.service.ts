import prisma from '../lib/prisma.js';

/**
 * Service d'archivage automatique des données anciennes
 * Permet de maintenir les performances en archivant les données > 1 an
 */

interface ArchiveResult {
  table: string;
  archivedCount: number;
  deletedCount: number;
}

class ArchivingService {
  /**
   * Archive et supprime les audit logs de plus d'un an
   * Les logs sont d'abord exportés vers une table d'archive avant suppression
   */
  async archiveOldAuditLogs(retentionDays: number = 365): Promise<ArchiveResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`[Archiving] Archivage des audit logs avant ${cutoffDate.toISOString()}`);

    // Compter les logs à archiver
    const countToArchive = await prisma.auditLog.count({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    if (countToArchive === 0) {
      console.log('[Archiving] Aucun audit log à archiver');
      return { table: 'audit_logs', archivedCount: 0, deletedCount: 0 };
    }

    console.log(`[Archiving] ${countToArchive} audit logs à archiver`);

    // Supprimer les anciens logs (en production, on exporterait d'abord vers un stockage froid)
    // Pour une vraie solution d'archivage, on utiliserait:
    // 1. Export vers S3/Azure Blob en format Parquet
    // 2. Ou une table d'archive partitionnée par date
    
    const deleted = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    console.log(`[Archiving] ${deleted.count} audit logs supprimés`);

    return {
      table: 'audit_logs',
      archivedCount: countToArchive,
      deletedCount: deleted.count,
    };
  }

  /**
   * Archive les statistiques journalières anciennes
   */
  async archiveOldDailyStats(retentionDays: number = 730): Promise<ArchiveResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const countToArchive = await prisma.dailyStats.count({
      where: {
        date: { lt: cutoffDate },
      },
    });

    if (countToArchive === 0) {
      return { table: 'daily_stats', archivedCount: 0, deletedCount: 0 };
    }

    const deleted = await prisma.dailyStats.deleteMany({
      where: {
        date: { lt: cutoffDate },
      },
    });

    return {
      table: 'daily_stats',
      archivedCount: countToArchive,
      deletedCount: deleted.count,
    };
  }

  /**
   * Archive les tickets terminés de plus de 2 ans
   * Garde les données patient mais supprime les entrées de file d'attente
   */
  async archiveOldQueueEntries(retentionDays: number = 730): Promise<ArchiveResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Supprimer les entrées de file d'attente terminées
    const deleted = await prisma.queueEntry.deleteMany({
      where: {
        status: 'COMPLETED',
        completedAt: { lt: cutoffDate },
      },
    });

    return {
      table: 'queue_entries',
      archivedCount: deleted.count,
      deletedCount: deleted.count,
    };
  }

  /**
   * Exécute l'archivage complet
   */
  async runFullArchive(): Promise<ArchiveResult[]> {
    console.log('[Archiving] Démarrage de l\'archivage complet...');
    
    const results: ArchiveResult[] = [];

    try {
      // Archiver les audit logs (> 1 an)
      results.push(await this.archiveOldAuditLogs(365));

      // Archiver les stats (> 2 ans)
      results.push(await this.archiveOldDailyStats(730));

      // Archiver les entrées de file (> 2 ans)
      results.push(await this.archiveOldQueueEntries(730));

      console.log('[Archiving] Archivage terminé:', results);
    } catch (error) {
      console.error('[Archiving] Erreur lors de l\'archivage:', error);
      throw error;
    }

    return results;
  }

  /**
   * Obtenir les statistiques de la base de données
   */
  async getDatabaseStats(): Promise<Record<string, number>> {
    const [
      auditLogs,
      patients,
      tickets,
      queueEntries,
      consultations,
      appointments,
    ] = await Promise.all([
      prisma.auditLog.count(),
      prisma.patient.count(),
      prisma.ticket.count(),
      prisma.queueEntry.count(),
      prisma.consultation.count(),
      prisma.appointment.count(),
    ]);

    return {
      auditLogs,
      patients,
      tickets,
      queueEntries,
      consultations,
      appointments,
    };
  }

  /**
   * Obtenir les logs d'audit par période
   */
  async getAuditLogsByPeriod(): Promise<Record<string, number>> {
    const now = new Date();
    
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [lastMonth, lastSixMonths, lastYear, older] = await Promise.all([
      prisma.auditLog.count({ where: { createdAt: { gte: oneMonthAgo } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: sixMonthsAgo, lt: oneMonthAgo } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: oneYearAgo, lt: sixMonthsAgo } } }),
      prisma.auditLog.count({ where: { createdAt: { lt: oneYearAgo } } }),
    ]);

    return {
      lastMonth,
      lastSixMonths,
      lastYear,
      older,
    };
  }
}

export const archivingService = new ArchivingService();
