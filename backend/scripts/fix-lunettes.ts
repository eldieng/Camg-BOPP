import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLunettes() {
  // Trouver toutes les entrées sur LUNETTES avec statut IN_SERVICE ou CALLED
  const entries = await prisma.queueEntry.findMany({
    where: {
      station: 'LUNETTES',
      status: { in: ['IN_SERVICE', 'CALLED'] },
    },
    include: {
      ticket: {
        include: {
          patient: true,
        },
      },
    },
  });

  console.log(`Trouvé ${entries.length} entrées sur LUNETTES:`);
  for (const entry of entries) {
    console.log(`- ${entry.ticket.ticketNumber}: ${entry.ticket.patient.firstName} ${entry.ticket.patient.lastName} (${entry.status})`);
  }

  // Marquer toutes ces entrées comme COMPLETED
  if (entries.length > 0) {
    const result = await prisma.queueEntry.updateMany({
      where: {
        station: 'LUNETTES',
        status: { in: ['IN_SERVICE', 'CALLED'] },
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    console.log(`\nMarqué ${result.count} entrées comme COMPLETED`);

    // Mettre à jour les tickets correspondants
    for (const entry of entries) {
      await prisma.ticket.update({
        where: { id: entry.ticketId },
        data: { status: 'COMPLETED' },
      });
    }
    console.log(`Tickets mis à jour`);
  }

  await prisma.$disconnect();
}

fixLunettes().catch(console.error);
