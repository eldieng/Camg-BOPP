import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const all = await prisma.patient.findMany({
    select: { id: true, firstName: true, lastName: true, registrationNumber: true }
  });
  
  console.log('Total patients:', all.length);
  console.log('\nPatients sans numero:');
  const withoutNum = all.filter(p => !p.registrationNumber);
  console.log('Count:', withoutNum.length);
  withoutNum.slice(0, 5).forEach(p => console.log(`  - ${p.lastName} ${p.firstName}: ${p.registrationNumber}`));
  
  console.log('\nPatients avec numero:');
  const withNum = all.filter(p => p.registrationNumber);
  console.log('Count:', withNum.length);
  withNum.slice(0, 5).forEach(p => console.log(`  - ${p.lastName} ${p.firstName}: ${p.registrationNumber}`));
}

check().finally(() => prisma.$disconnect());
