import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { JwtPayload } from '../types/index.js';

export interface LoginResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    assignedRoom: number | null;
  };
  token: string;
  expiresIn: number;
}

export interface LoginError {
  code: string;
  message: string;
}

/**
 * Service d'authentification
 */
export class AuthService {
  /**
   * Authentifie un utilisateur avec email et mot de passe
   */
  async login(email: string, password: string): Promise<LoginResult | LoginError> {
    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Email ou mot de passe incorrect',
      };
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return {
        code: 'ACCOUNT_DISABLED',
        message: 'Ce compte a été désactivé',
      };
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Email ou mot de passe incorrect',
      };
    }

    // Mettre à jour la date de dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Générer le token JWT
    const payload: JwtPayload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        assignedRoom: user.assignedRoom,
      },
      token,
      expiresIn: 86400, // 24 heures en secondes
    };
  }

  /**
   * Récupère les informations de l'utilisateur connecté
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        assignedRoom: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Change le mot de passe d'un utilisateur
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: 'Utilisateur non trouvé' };
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return { success: false, message: 'Mot de passe actuel incorrect' };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { success: true, message: 'Mot de passe modifié avec succès' };
  }

  /**
   * Met à jour le profil d'un utilisateur
   */
  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string }
  ): Promise<{ success: boolean; message: string; user?: any }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: 'Utilisateur non trouvé' };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName || user.firstName,
        lastName: data.lastName || user.lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        assignedRoom: true,
      },
    });

    return { success: true, message: 'Profil mis à jour avec succès', user: updatedUser };
  }
}

export const authService = new AuthService();
