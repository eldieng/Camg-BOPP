import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, firstName: true, lastName: true, role: true }
  });
  console.log('Utilisateurs dans la base:');
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main();
