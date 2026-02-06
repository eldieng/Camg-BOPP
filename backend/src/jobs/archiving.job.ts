import { archivingService } from '../services/archiving.service.js';

/**
 * Job d'archivage automatique
 * S'exécute une fois par jour à 3h du matin
 */

let archivingInterval: NodeJS.Timeout | null = null;

export function startArchivingJob(): void {
  // Calculer le temps jusqu'à 3h du matin
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(3, 0, 0, 0);
  
  // Si 3h est déjà passé aujourd'hui, programmer pour demain
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  const msUntilNextRun = nextRun.getTime() - now.getTime();
  
  console.log(`[ArchivingJob] Prochain archivage prévu à ${nextRun.toLocaleString()}`);
  
  // Premier lancement
  setTimeout(() => {
    runArchiving();
    
    // Puis toutes les 24h
    archivingInterval = setInterval(runArchiving, 24 * 60 * 60 * 1000);
  }, msUntilNextRun);
}

async function runArchiving(): Promise<void> {
  console.log('[ArchivingJob] Démarrage de l\'archivage automatique...');
  
  try {
    const results = await archivingService.runFullArchive();
    
    const totalArchived = results.reduce((sum, r) => sum + r.archivedCount, 0);
    const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0);
    
    console.log(`[ArchivingJob] Terminé: ${totalArchived} enregistrements archivés, ${totalDeleted} supprimés`);
  } catch (error) {
    console.error('[ArchivingJob] Erreur:', error);
  }
}

export function stopArchivingJob(): void {
  if (archivingInterval) {
    clearInterval(archivingInterval);
    archivingInterval = null;
    console.log('[ArchivingJob] Job arrêté');
  }
}

/**
 * Exécuter l'archivage manuellement (pour les tests ou l'admin)
 */
export async function runArchivingManually(): Promise<void> {
  await runArchiving();
}
