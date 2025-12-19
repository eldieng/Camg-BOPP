/**
 * Service de stockage hors-ligne pour l'accueil
 * Permet de stocker les données localement quand le réseau est indisponible
 */

const STORAGE_KEYS = {
  PENDING_TICKETS: 'camg_pending_tickets',
  CACHED_PATIENTS: 'camg_cached_patients',
  LAST_SYNC: 'camg_last_sync',
};

interface PendingTicket {
  id: string;
  patientId: string;
  patientName: string;
  priority: string;
  priorityReason?: string;
  createdAt: string;
  synced: boolean;
}

interface CachedPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone?: string;
}

class OfflineStorageService {
  /**
   * Vérifier si on est en ligne
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Écouter les changements de connexion
   */
  onConnectionChange(callback: (online: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * Sauvegarder un ticket en attente de synchronisation
   */
  savePendingTicket(ticket: PendingTicket): void {
    const tickets = this.getPendingTickets();
    tickets.push(ticket);
    localStorage.setItem(STORAGE_KEYS.PENDING_TICKETS, JSON.stringify(tickets));
  }

  /**
   * Récupérer les tickets en attente de synchronisation
   */
  getPendingTickets(): PendingTicket[] {
    const data = localStorage.getItem(STORAGE_KEYS.PENDING_TICKETS);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Marquer un ticket comme synchronisé
   */
  markTicketSynced(ticketId: string): void {
    const tickets = this.getPendingTickets();
    const updated = tickets.map(t => 
      t.id === ticketId ? { ...t, synced: true } : t
    );
    localStorage.setItem(STORAGE_KEYS.PENDING_TICKETS, JSON.stringify(updated));
  }

  /**
   * Supprimer les tickets synchronisés
   */
  clearSyncedTickets(): void {
    const tickets = this.getPendingTickets().filter(t => !t.synced);
    localStorage.setItem(STORAGE_KEYS.PENDING_TICKETS, JSON.stringify(tickets));
  }

  /**
   * Mettre en cache les patients récemment recherchés
   */
  cachePatients(patients: CachedPatient[]): void {
    const existing = this.getCachedPatients();
    const merged = [...patients, ...existing];
    // Garder seulement les 100 derniers patients uniques
    const unique = merged.filter((p, i, arr) => 
      arr.findIndex(x => x.id === p.id) === i
    ).slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.CACHED_PATIENTS, JSON.stringify(unique));
  }

  /**
   * Récupérer les patients en cache
   */
  getCachedPatients(): CachedPatient[] {
    const data = localStorage.getItem(STORAGE_KEYS.CACHED_PATIENTS);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Rechercher dans les patients en cache
   */
  searchCachedPatients(query: string): CachedPatient[] {
    const patients = this.getCachedPatients();
    const lowerQuery = query.toLowerCase();
    return patients.filter(p => 
      p.firstName.toLowerCase().includes(lowerQuery) ||
      p.lastName.toLowerCase().includes(lowerQuery) ||
      (p.phone && p.phone.includes(query))
    );
  }

  /**
   * Mettre à jour la date de dernière synchronisation
   */
  updateLastSync(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  /**
   * Récupérer la date de dernière synchronisation
   */
  getLastSync(): Date | null {
    const data = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return data ? new Date(data) : null;
  }

  /**
   * Nombre de tickets en attente de synchronisation
   */
  getPendingCount(): number {
    return this.getPendingTickets().filter(t => !t.synced).length;
  }
}

export const offlineStorage = new OfflineStorageService();
export default offlineStorage;
