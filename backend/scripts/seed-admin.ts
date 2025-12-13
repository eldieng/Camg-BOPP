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

  if (existingAdmin) {
    console.log('⚠️  Un administrateur existe déjà:');
    console.log(`   Email: ${existingAdmin.email}`);
    console.log(`   Nom: ${existingAdmin.firstName} ${existingAdmin.lastName}`);
    console.log('\n   Utilisez cet email pour vous connecter.');
    return;
  }

  // Créer l'admin
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@camg-bopp.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'CAMG-BOPP',
      role: 'ADMIN',
      isActive: true,
    }
  });

  console.log('✅ Administrateur créé avec succès!\n');
  console.log('   ┌─────────────────────────────────────┐');
  console.log('   │  Identifiants de connexion         │');
  console.log('   ├─────────────────────────────────────┤');
  console.log('   │  Email: admin@camg-bopp.com        │');
  console.log('   │  Mot de passe: Admin123!           │');
  console.log('   └─────────────────────────────────────┘');
  console.log('\n⚠️  IMPORTANT: Changez ce mot de passe après la première connexion!');

  // Créer aussi les autres utilisateurs de test
  console.log('\n🔧 Création des utilisateurs de test...\n');

  const users = [
    { email: 'accueil@camg-bopp.com', firstName: 'Agent', lastName: 'Accueil', role: 'ACCUEIL' as const },
    { email: 'testvue@camg-bopp.com', firstName: 'Technicien', lastName: 'Vision', role: 'TEST_VUE' as const },
    { email: 'medecin@camg-bopp.com', firstName: 'Dr', lastName: 'Ophtalmologue', role: 'MEDECIN' as const },
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
