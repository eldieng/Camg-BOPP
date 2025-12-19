/**
 * Service de notifications push pour le navigateur
 */

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Demander la permission pour les notifications
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    const result = await Notification.requestPermission();
    this.permission = result;
    return result === 'granted';
  }

  /**
   * Vérifier si les notifications sont autorisées
   */
  isEnabled(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Afficher une notification
   */
  show(title: string, options?: NotificationOptions): Notification | null {
    if (!this.isEnabled()) {
      return null;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    // Fermer automatiquement après 10 secondes
    setTimeout(() => notification.close(), 10000);

    return notification;
  }

  /**
   * Notification pour un patient appelé
   */
  notifyPatientCalled(patientName: string, ticketNumber: string, station: string): Notification | null {
    return this.show(`Patient appelé - ${station}`, {
      body: `${patientName} (${ticketNumber})`,
      tag: `patient-called-${ticketNumber}`,
      requireInteraction: true,
    });
  }

  /**
   * Notification pour un nouveau patient en attente
   */
  notifyNewPatient(ticketNumber: string, station: string): Notification | null {
    return this.show(`Nouveau patient - ${station}`, {
      body: `Ticket ${ticketNumber} en attente`,
      tag: `new-patient-${ticketNumber}`,
    });
  }

  /**
   * Notification pour un rendez-vous
   */
  notifyAppointment(patientName: string, time: string): Notification | null {
    return this.show('Rendez-vous', {
      body: `${patientName} à ${time}`,
      tag: `appointment-${time}`,
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
