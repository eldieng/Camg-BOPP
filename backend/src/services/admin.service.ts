import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  assignedRoom?: number;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  assignedRoom?: number | null;
  isActive?: boolean;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  assignedRoom: number | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}

export class AdminService {
  /**
   * Liste tous les utilisateurs
   */
  async getAllUsers(): Promise<UserWithoutPassword[]> {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        assignedRoom: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async getUserById(id: string): Promise<UserWithoutPassword | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        assignedRoom: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });
  }

  /**
   * Créer un nouvel utilisateur
   */
  async createUser(data: CreateUserDto): Promise<UserWithoutPassword> {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        assignedRoom: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });
  }

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<UserWithoutPassword> {
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (existingUser) {
        throw new Error('Un utilisateur avec cet email existe déjà');
      }
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        assignedRoom: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });
  }

  /**
   * Réinitialiser le mot de passe
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * Activer/Désactiver un utilisateur
   */
  async toggleUserStatus(id: string): Promise<UserWithoutPassword> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Utilisateur non trouvé');

    return prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        assignedRoom: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });
  }

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  /**
   * Statistiques utilisateurs
   */
  async getUserStats() {
    const [total, byRole, active] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byRole: byRole.map(r => ({ role: r.role, count: r._count })),
    };
  }
}

export const adminService = new AdminService();
