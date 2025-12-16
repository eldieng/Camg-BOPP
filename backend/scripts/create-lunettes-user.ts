import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin123!', 10);
  
  // Mettre à jour le mot de passe si l'utilisateur existe, sinon le créer
  const user = await prisma.user.upsert({
    where: { email: 'lunettes@camg-bopp.com' },
    update: { password: hash }, // Forcer la mise à jour du mot de passe
    create: {
      email: 'lunettes@camg-bopp.com',
      password: hash,
      firstName: 'Opticien',
      lastName: 'Lunettes',
      role: 'LUNETTES',
      isActive: true
    }
  });
  
  console.log('✅ Utilisateur LUNETTES créé/mis à jour:', user.email);
  console.log('   Mot de passe: Admin123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
