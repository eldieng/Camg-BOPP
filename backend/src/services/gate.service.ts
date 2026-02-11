import prisma from '../lib/prisma.js';
import { GateEntryStatus, Priority } from '@prisma/client';

const gateInclude = {
  patient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      isPregnant: true,
      isDisabled: true,
    },
  },
  appointment: {
    select: {
      id: true,
      scheduledDate: true,
      scheduledTime: true,
      reason: true,
      status: true,
    },
  },
};

export class GateService {
  /**
   * Charger la liste du jour : RDV attendus + patients arrivés + walk-ins
   * Auto-génère les entrées EXPECTED pour les RDV du jour qui n'en ont pas encore
   */
  async getTodayList() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // 1. Récupérer les RDV du jour qui n'ont pas encore de GateEntry
    const appointmentsWithoutEntry = await prisma.appointment.findMany({
      where: {
        scheduledDate: { gte: startOfDay, lte: endOfDay },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        gateEntry: null,
      },
      include: {
        patient: true,
      },
    });

    // 2. Créer automatiquement les GateEntry EXPECTED pour ces RDV
    for (const appt of appointmentsWithoutEntry) {
      const patient = appt.patient;
      // Déterminer la priorité en fonction du patient
      let priority: Priority = 'NORMAL';
      if (patient.isPregnant) priority = 'PREGNANT';
      else if (patient.isDisabled) priority = 'DISABLED';
      else {
        const age = Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age >= 60) priority = 'ELDERLY';
      }

      await prisma.gateEntry.create({
        data: {
          patientId: patient.id,
          appointmentId: appt.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          phone: patient.phone,
          priority,
          status: 'EXPECTED',
          date: startOfDay,
        },
      });
    }

    // 3. Récupérer toutes les GateEntry du jour
    const entries = await prisma.gateEntry.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: gateInclude,
      orderBy: [
        { priority: 'asc' }, // EMERGENCY, ELDERLY, PREGNANT, DISABLED, NORMAL
        { createdAt: 'asc' },
      ],
    });

    // Tri personnalisé : prioritaires en haut, puis par heure d'arrivée
    const priorityOrder: Record<string, number> = {
      EMERGENCY: 0,
      PREGNANT: 1,
      DISABLED: 2,
      ELDERLY: 3,
      NORMAL: 4,
    };

    entries.sort((a, b) => {
      // D'abord par statut : ARRIVED en haut, EXPECTED ensuite
      const statusOrder: Record<string, number> = {
        ARRIVED: 0,
        SENT_TO_ACCUEIL: 1,
        EXPECTED: 2,
        REGISTERED: 3,
        NO_SHOW: 4,
      };
      const statusDiff = (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
      if (statusDiff !== 0) return statusDiff;

      // Puis par priorité
      const prioDiff = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
      if (prioDiff !== 0) return prioDiff;

      // Puis par heure d'arrivée ou de création
      return (a.arrivedAt || a.createdAt).getTime() - (b.arrivedAt || b.createdAt).getTime();
    });

    // Stats
    const stats = {
      total: entries.length,
      expected: entries.filter(e => e.status === 'EXPECTED').length,
      arrived: entries.filter(e => e.status === 'ARRIVED').length,
      sentToAccueil: entries.filter(e => e.status === 'SENT_TO_ACCUEIL').length,
      registered: entries.filter(e => e.status === 'REGISTERED').length,
      noShow: entries.filter(e => e.status === 'NO_SHOW').length,
    };

    return { entries, stats };
  }

  /**
   * Marquer un patient comme arrivé (coché par l'agent)
   */
  async markArrived(id: string) {
    return prisma.gateEntry.update({
      where: { id },
      data: {
        status: 'ARRIVED',
        arrivedAt: new Date(),
      },
      include: gateInclude,
    });
  }

  /**
   * Envoyer à l'accueil (le patient passe de la porte à l'intérieur)
   */
  async sendToAccueil(id: string) {
    return prisma.gateEntry.update({
      where: { id },
      data: {
        status: 'SENT_TO_ACCUEIL',
        sentAt: new Date(),
      },
      include: gateInclude,
    });
  }

  /**
   * Marquer absent
   */
  async markNoShow(id: string) {
    const entry = await prisma.gateEntry.update({
      where: { id },
      data: { status: 'NO_SHOW' },
      include: gateInclude,
    });

    // Si lié à un RDV, marquer le RDV aussi
    if (entry.appointmentId) {
      await prisma.appointment.update({
        where: { id: entry.appointmentId },
        data: { status: 'NO_SHOW' },
      });
    }

    return entry;
  }

  /**
   * Marquer comme enregistré (ticket créé par l'accueil)
   */
  async markRegistered(id: string) {
    return prisma.gateEntry.update({
      where: { id },
      data: { status: 'REGISTERED' },
      include: gateInclude,
    });
  }

  /**
   * Ajouter un walk-in (patient sans RDV qui se présente)
   */
  async addWalkIn(data: {
    firstName: string;
    lastName: string;
    phone?: string;
    priority?: Priority;
    notes?: string;
    patientId?: string;
  }) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    return prisma.gateEntry.create({
      data: {
        patientId: data.patientId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        priority: data.priority || 'NORMAL',
        status: 'ARRIVED',
        arrivedAt: new Date(),
        isWalkIn: true,
        notes: data.notes,
        date: startOfDay,
      },
      include: gateInclude,
    });
  }

  /**
   * Récupérer les patients arrivés et envoyés à l'accueil (pour la page Accueil)
   */
  async getArrivedForAccueil() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return prisma.gateEntry.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: 'SENT_TO_ACCUEIL',
      },
      include: gateInclude,
      orderBy: [
        { priority: 'asc' },
        { sentAt: 'asc' },
      ],
    });
  }
}

export const gateService = new GateService();
