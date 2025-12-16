import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin123!', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'lunettes@camg-bopp.com' },
    update: {},
    create: {
      email: 'lunettes@camg-bopp.com',
      password: hash,
      firstName: 'Opticien',
      lastName: 'Lunettes',
      role: 'LUNETTES',
      isActive: true
    }
  });
  
  console.log('✅ Utilisateur LUNETTES créé:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
