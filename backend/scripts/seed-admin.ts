/**
 * Script pour créer l'utilisateur admin initial en production
 * 
 * Usage: npx tsx scripts/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Création de l\'utilisateur admin...\n');

  // Vérifier si un admin existe déjà
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@camg-bopp.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'CAMG-BOPP',
        role: 'ADMIN',
        isActive: true,
      }
    });
    console.log('✅ Administrateur créé: admin@camg-bopp.com');
  } else {
    console.log('⚠️  Admin existe déjà: ' + existingAdmin.email);
  }

  // Créer aussi les autres utilisateurs de test
  console.log('\n🔧 Création des utilisateurs de test...\n');

  const users = [
    { email: 'accueil@camg-bopp.com', firstName: 'Agent', lastName: 'Accueil', role: 'ACCUEIL' as const },
    { email: 'testvue@camg-bopp.com', firstName: 'Technicien', lastName: 'Vision', role: 'TEST_VUE' as const },
    { email: 'medecin@camg-bopp.com', firstName: 'Dr', lastName: 'Ophtalmologue', role: 'MEDECIN' as const },
    { email: 'lunettes@camg-bopp.com', firstName: 'Opticien', lastName: 'Lunettes', role: 'LUNETTES' as const },
    { email: 'medicaments@camg-bopp.com', firstName: 'Pharmacien', lastName: 'Médicaments', role: 'MEDICAMENTS' as const },
  ];

  for (const userData of users) {
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          isActive: true,
        }
      });
      console.log(`   ✅ ${userData.role}: ${userData.email}`);
    } else {
      console.log(`   ⚠️  ${userData.role}: ${userData.email} (existe déjà)`);
    }
  }

  console.log('\n📋 Tous les utilisateurs utilisent le mot de passe: Admin123!');
  console.log('   Changez-les après la première connexion.\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
