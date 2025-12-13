import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOldEntries() {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

  // Marquer comme COMPLETED toutes les entrées IN_SERVICE ou CALLED des jours précédents
  const result = await prisma.queueEntry.updateMany({
    where: {
      status: { in: ['IN_SERVICE', 'CALLED'] },
      createdAt: { lt: startOfDay },
    },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  console.log(`Nettoyé ${result.count} entrées obsolètes`);

  // Aussi nettoyer les tickets correspondants
  const ticketResult = await prisma.ticket.updateMany({
    where: {
      status: 'IN_PROGRESS',
      createdAt: { lt: startOfDay },
    },
    data: {
      status: 'COMPLETED',
    },
  });

  console.log(`Nettoyé ${ticketResult.count} tickets obsolètes`);

  await prisma.$disconnect();
}

cleanupOldEntries().catch(console.error);
