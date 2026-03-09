/**
 * Script de migration pour attribuer des numéros d'immatriculation
 * aux patients existants qui n'en ont pas.
 * 
 * Usage: npx tsx scripts/migrate-registration-numbers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateRegistrationNumber(): Promise<string> {
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

async function migrateRegistrationNumbers() {
  console.log('🔄 Début de la migration des numéros d\'immatriculation...\n');

  // Trouver tous les patients sans numéro d'immatriculation
  const patientsWithoutNumber = await prisma.patient.findMany({
    where: {
      OR: [
        { registrationNumber: { equals: undefined } },
        { registrationNumber: '' },
      ],
    },
    orderBy: {
      createdAt: 'asc', // Les plus anciens d'abord
    },
  });

  console.log(`📋 ${patientsWithoutNumber.length} patient(s) sans numéro d'immatriculation trouvé(s)\n`);

  if (patientsWithoutNumber.length === 0) {
    console.log('✅ Tous les patients ont déjà un numéro d\'immatriculation.');
    return;
  }

  let migrated = 0;
  const errors: string[] = [];

  for (const patient of patientsWithoutNumber) {
    try {
      const registrationNumber = await generateRegistrationNumber();
      
      await prisma.patient.update({
        where: { id: patient.id },
        data: { registrationNumber },
      });

      console.log(`✅ ${patient.lastName} ${patient.firstName} → ${registrationNumber}`);
      migrated++;
    } catch (error) {
      const errorMsg = `❌ Erreur pour ${patient.lastName} ${patient.firstName}: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  console.log('\n========================================');
  console.log(`📊 Résumé de la migration:`);
  console.log(`   - Patients migrés: ${migrated}/${patientsWithoutNumber.length}`);
  if (errors.length > 0) {
    console.log(`   - Erreurs: ${errors.length}`);
  }
  console.log('========================================\n');
}

// Exécution
migrateRegistrationNumbers()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
