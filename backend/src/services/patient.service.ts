import prisma from '../lib/prisma.js';
import { Gender, Patient, Prisma } from '@prisma/client';

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  address?: string;
  phone?: string;
  emergencyContact?: string;
  isPregnant?: boolean;
  isDisabled?: boolean;
  isVIP?: boolean;
  vipReason?: string;
  notes?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {}

export interface PatientSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedPatients {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class PatientService {
  /**
   * Générer un numéro d'immatriculation unique
   * Format: CAMG-YYYY-NNNNN (ex: CAMG-2026-00001)
   */
  async generateRegistrationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CAMG-${year}-`;
    
    // Trouver le dernier numéro de l'année
    const lastPatient = await prisma.patient.findFirst({
      where: {
        registrationNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        registrationNumber: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastPatient?.registrationNumber) {
      const lastNumber = parseInt(lastPatient.registrationNumber.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }

  /**
   * Créer un nouveau patient
   */
  async create(data: CreatePatientDto): Promise<Patient> {
    const registrationNumber = await this.generateRegistrationNumber();
    
    return prisma.patient.create({
      data: {
        registrationNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        address: data.address,
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        isPregnant: data.isPregnant ?? false,
        isDisabled: data.isDisabled ?? false,
        isVIP: data.isVIP ?? false,
        vipReason: data.vipReason,
        notes: data.notes,
      },
    });
  }

  /**
   * Récupérer tous les patients avec pagination et recherche
   */
  async findAll(params: PatientSearchParams): Promise<PaginatedPatients> {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    // Construire la clause WHERE pour la recherche
    const where: Prisma.PatientWhereInput = params.search
      ? {
          OR: [
            { firstName: { contains: params.search, mode: 'insensitive' } },
            { lastName: { contains: params.search, mode: 'insensitive' } },
            { phone: { contains: params.search } },
          ],
        }
      : {};

    // Compter le total
    const total = await prisma.patient.count({ where });

    // Récupérer les patients
    const patients = await prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    return {
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupérer un patient par ID
   */
  async findById(id: string): Promise<Patient | null> {
    return prisma.patient.findUnique({
      where: { id },
    });
  }

  /**
   * Récupérer un patient avec son historique complet
   */
  async findByIdWithHistory(id: string) {
    return prisma.patient.findUnique({
      where: { id },
      include: {
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        visionTests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            technician: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        consultations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            doctor: {
              select: { firstName: true, lastName: true },
            },
            prescriptions: true,
          },
        },
      },
    });
  }

  /**
   * Mettre à jour un patient
   */
  async update(id: string, data: UpdatePatientDto): Promise<Patient> {
    const updateData: Prisma.PatientUpdateInput = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
    if (data.isPregnant !== undefined) updateData.isPregnant = data.isPregnant;
    if (data.isDisabled !== undefined) updateData.isDisabled = data.isDisabled;
    if ((data as any).isVIP !== undefined) updateData.isVIP = (data as any).isVIP;
    if ((data as any).vipReason !== undefined) updateData.vipReason = (data as any).vipReason;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.patient.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Supprimer un patient et toutes ses données associées
   */
  async delete(id: string): Promise<Patient> {
    // Supprimer en cascade dans l'ordre des dépendances
    // 1. Récupérer les tickets du patient
    const tickets = await prisma.ticket.findMany({
      where: { patientId: id },
      select: { id: true },
    });
    const ticketIds = tickets.map(t => t.id);

    // 2. Supprimer les entrées de file d'attente liées aux tickets
    if (ticketIds.length > 0) {
      await prisma.queueEntry.deleteMany({
        where: { ticketId: { in: ticketIds } },
      });
    }

    // 3. Supprimer les tickets
    await prisma.ticket.deleteMany({
      where: { patientId: id },
    });

    // 4. Récupérer les consultations pour supprimer les prescriptions
    const consultations = await prisma.consultation.findMany({
      where: { patientId: id },
      select: { id: true },
    });
    const consultationIds = consultations.map(c => c.id);

    // 5. Supprimer les prescriptions
    if (consultationIds.length > 0) {
      await prisma.prescription.deleteMany({
        where: { consultationId: { in: consultationIds } },
      });
    }

    // 6. Supprimer les consultations
    await prisma.consultation.deleteMany({
      where: { patientId: id },
    });

    // 7. Supprimer les tests de vue
    await prisma.visionTest.deleteMany({
      where: { patientId: id },
    });

    // 8. Finalement supprimer le patient
    return prisma.patient.delete({
      where: { id },
    });
  }

  /**
   * Recherche rapide de patients (pour autocomplete)
   */
  async quickSearch(query: string, limit: number = 10): Promise<Patient[]> {
    if (!query || query.length < 2) return [];

    return prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { registrationNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { lastName: 'asc' },
    });
  }

  /**
   * Rechercher un patient par numéro d'immatriculation
   */
  async findByRegistrationNumber(registrationNumber: string): Promise<Patient | null> {
    return prisma.patient.findUnique({
      where: { registrationNumber },
    });
  }

  /**
   * Mettre à jour le statut VIP d'un patient
   */
  async updateVIPStatus(id: string, isVIP: boolean, vipReason?: string): Promise<Patient> {
    return prisma.patient.update({
      where: { id },
      data: {
        isVIP,
        vipReason: isVIP ? vipReason : null,
      },
    });
  }

  /**
   * Calculer l'âge à partir de la date de naissance
   */
  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Vérifier si le patient est une personne âgée (65+)
   */
  isElderly(dateOfBirth: Date): boolean {
    return this.calculateAge(dateOfBirth) >= 65;
  }
}

export const patientService = new PatientService();
