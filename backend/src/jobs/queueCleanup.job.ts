import prisma from '../lib/prisma.js';

export function startQueueCleanupJob(): void {
  const intervalMs = 5 * 60 * 1000;

  const run = async () => {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);

    await prisma.queueEntry.updateMany({
      where: {
        status: 'CALLED',
        calledAt: { lt: cutoff },
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await prisma.ticket.updateMany({
      where: {
        status: 'IN_PROGRESS',
        queueEntry: {
          status: 'COMPLETED',
        },
      },
      data: {
        status: 'COMPLETED',
      },
    });
  };

  run().catch((err) => console.error('Queue cleanup job error:', err));
  setInterval(() => {
    run().catch((err) => console.error('Queue cleanup job error:', err));
  }, intervalMs);
}
