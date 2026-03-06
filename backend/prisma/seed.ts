import { PrismaClient, UserRole, Gender, Priority, TicketStatus, Station, QueueStatus, EyeType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Fonction pour générer une date aléatoire
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Fonction pour générer un numéro de ticket
function generateTicketNumber(index: number): string {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  return `${dateStr}-${String(index).padStart(3, '0')}`;
}

async function main() {
  console.log('🌱 Début du seeding...');

  // ============================================
  // UTILISATEURS
  // ============================================
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@camg-bopp.sn' },
    update: {},
    create: {
      email: 'admin@camg-bopp.sn',
      password: adminPassword,
      firstName: 'Administrateur',
      lastName: 'CAMG-BOPP',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin créé:', admin.email);

  const accueilPassword = await bcrypt.hash('accueil123', 10);
  const accueil = await prisma.user.upsert({
    where: { email: 'accueil@camg-bopp.sn' },
    update: {},
    create: {
      email: 'accueil@camg-bopp.sn',
      password: accueilPassword,
      firstName: 'Aminata',
      lastName: 'Diallo',
      role: UserRole.ACCUEIL,
      isActive: true,
    },
  });
  console.log('✅ Agent accueil créé:', accueil.email);

  const testVuePassword = await bcrypt.hash('testvue123', 10);
  const testVue = await prisma.user.upsert({
    where: { email: 'testvue@camg-bopp.sn' },
    update: {},
    create: {
      email: 'testvue@camg-bopp.sn',
      password: testVuePassword,
      firstName: 'Moussa',
      lastName: 'Sow',
      role: UserRole.TEST_VUE,
      isActive: true,
    },
  });
  console.log('✅ Technicien test vue créé:', testVue.email);

  const medecinPassword = await bcrypt.hash('medecin123', 10);
  const medecin = await prisma.user.upsert({
    where: { email: 'medecin@camg-bopp.sn' },
    update: {},
    create: {
      email: 'medecin@camg-bopp.sn',
      password: medecinPassword,
      firstName: 'Dr. Amadou',
      lastName: 'Ndiaye',
      role: UserRole.MEDECIN,
      isActive: true,
    },
  });
  console.log('✅ Médecin créé:', medecin.email);

  // ============================================
  // PATIENTS EXEMPLES
  // ============================================
  console.log('\n👥 Création des patients...');
  
  const patientsData = [
    { firstName: 'Fatou', lastName: 'Diop', gender: Gender.FEMALE, dob: new Date('1985-03-15'), phone: '77 123 45 67', isPregnant: true },
    { firstName: 'Ibrahima', lastName: 'Fall', gender: Gender.MALE, dob: new Date('1950-08-22'), phone: '78 234 56 78', isDisabled: false },
    { firstName: 'Mariama', lastName: 'Sy', gender: Gender.FEMALE, dob: new Date('1992-11-08'), phone: '76 345 67 89' },
    { firstName: 'Ousmane', lastName: 'Ba', gender: Gender.MALE, dob: new Date('1978-05-30'), phone: '70 456 78 90' },
    { firstName: 'Aissatou', lastName: 'Ndiaye', gender: Gender.FEMALE, dob: new Date('1945-01-12'), phone: '77 567 89 01', isDisabled: true },
    { firstName: 'Mamadou', lastName: 'Diallo', gender: Gender.MALE, dob: new Date('1988-07-25'), phone: '78 678 90 12' },
    { firstName: 'Khady', lastName: 'Gueye', gender: Gender.FEMALE, dob: new Date('1995-09-18'), phone: '76 789 01 23', isPregnant: true },
    { firstName: 'Abdoulaye', lastName: 'Seck', gender: Gender.MALE, dob: new Date('1960-12-05'), phone: '70 890 12 34' },
    { firstName: 'Ndèye', lastName: 'Mbaye', gender: Gender.FEMALE, dob: new Date('2000-04-20'), phone: '77 901 23 45' },
    { firstName: 'Cheikh', lastName: 'Thiam', gender: Gender.MALE, dob: new Date('1972-06-14'), phone: '78 012 34 56' },
    { firstName: 'Rama', lastName: 'Sarr', gender: Gender.FEMALE, dob: new Date('1983-02-28'), phone: '76 123 45 67' },
    { firstName: 'Modou', lastName: 'Faye', gender: Gender.MALE, dob: new Date('1955-10-10'), phone: '70 234 56 78' },
    { firstName: 'Sokhna', lastName: 'Diouf', gender: Gender.FEMALE, dob: new Date('1998-08-08'), phone: '77 345 67 89' },
    { firstName: 'Pape', lastName: 'Cissé', gender: Gender.MALE, dob: new Date('1990-03-03'), phone: '78 456 78 90' },
    { firstName: 'Awa', lastName: 'Kane', gender: Gender.FEMALE, dob: new Date('1965-11-25'), phone: '76 567 89 01' },
  ];

  const patients = [];
  const year = new Date().getFullYear();
  for (let i = 0; i < patientsData.length; i++) {
    const p = patientsData[i];
    const patient = await prisma.patient.create({
      data: {
        registrationNumber: `CAMG-${year}-${String(i + 1).padStart(5, '0')}`,
        firstName: p.firstName,
        lastName: p.lastName,
        gender: p.gender,
        dateOfBirth: p.dob,
        phone: p.phone,
        address: 'Dakar, Sénégal',
        isPregnant: p.isPregnant || false,
        isDisabled: p.isDisabled || false,
        isVIP: i === 0, // Premier patient est VIP pour test
        vipReason: i === 0 ? 'Bienfaiteur du dispensaire' : null,
      },
    });
    patients.push(patient);
  }
  console.log(`✅ ${patients.length} patients créés`);

  // ============================================
  // TICKETS DU JOUR
  // ============================================
  console.log('\n🎫 Création des tickets...');
  
  const today = new Date();
  const tickets = [];
  const priorities = [Priority.NORMAL, Priority.NORMAL, Priority.NORMAL, Priority.ELDERLY, Priority.PREGNANT, Priority.DISABLED];
  const statuses = [TicketStatus.COMPLETED, TicketStatus.COMPLETED, TicketStatus.COMPLETED, TicketStatus.IN_PROGRESS, TicketStatus.WAITING, TicketStatus.WAITING];

  // Définir les scénarios de tickets avec cohérence station/statut
  // IMPORTANT: Les patients en CONSULTATION doivent avoir passé le test de vue (hasVisionTest: true)
  const ticketScenarios = [
    // 3 patients en attente à TEST_VUE (pas encore de test de vue)
    { ticketStatus: TicketStatus.IN_PROGRESS, station: Station.TEST_VUE, queueStatus: QueueStatus.WAITING, hasVisionTest: false },
    { ticketStatus: TicketStatus.IN_PROGRESS, station: Station.TEST_VUE, queueStatus: QueueStatus.WAITING, hasVisionTest: false },
    { ticketStatus: TicketStatus.IN_PROGRESS, station: Station.TEST_VUE, queueStatus: QueueStatus.WAITING, hasVisionTest: false },
    // 1 patient en service à TEST_VUE (en cours de test)
    { ticketStatus: TicketStatus.IN_PROGRESS, station: Station.TEST_VUE, queueStatus: QueueStatus.IN_SERVICE, hasVisionTest: false },
    // 2 patients en attente à CONSULTATION (ont passé le test de vue)
    { ticketStatus: TicketStatus.IN_PROGRESS, station: Station.CONSULTATION, queueStatus: QueueStatus.WAITING, hasVisionTest: true },
    { ticketStatus: TicketStatus.IN_PROGRESS, station: Station.CONSULTATION, queueStatus: QueueStatus.WAITING, hasVisionTest: true },
    // 1 patient en service à CONSULTATION (a passé le test de vue)
    { ticketStatus: TicketStatus.IN_PROGRESS, station: Station.CONSULTATION, queueStatus: QueueStatus.IN_SERVICE, hasVisionTest: true },
    // 5 patients terminés (ont passé test de vue + consultation)
    { ticketStatus: TicketStatus.COMPLETED, station: Station.CONSULTATION, queueStatus: QueueStatus.COMPLETED, hasVisionTest: true, hasConsultation: true },
    { ticketStatus: TicketStatus.COMPLETED, station: Station.CONSULTATION, queueStatus: QueueStatus.COMPLETED, hasVisionTest: true, hasConsultation: true },
    { ticketStatus: TicketStatus.COMPLETED, station: Station.CONSULTATION, queueStatus: QueueStatus.COMPLETED, hasVisionTest: true, hasConsultation: true },
    { ticketStatus: TicketStatus.COMPLETED, station: Station.CONSULTATION, queueStatus: QueueStatus.COMPLETED, hasVisionTest: true, hasConsultation: true },
    { ticketStatus: TicketStatus.COMPLETED, station: Station.CONSULTATION, queueStatus: QueueStatus.COMPLETED, hasVisionTest: true, hasConsultation: true },
  ];

  const patientsWithVisionTest: string[] = [];
  const patientsWithConsultation: string[] = [];

  for (let i = 0; i < ticketScenarios.length; i++) {
    const patient = patients[i];
    const scenario = ticketScenarios[i];
    const priority = patient.isPregnant ? Priority.PREGNANT : 
                     patient.isDisabled ? Priority.DISABLED :
                     new Date().getFullYear() - patient.dateOfBirth.getFullYear() > 60 ? Priority.ELDERLY : Priority.NORMAL;
    
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(i + 1),
        qrCode: uuidv4(),
        patientId: patient.id,
        priority,
        status: scenario.ticketStatus,
        createdAt: new Date(today.getTime() - (12 - i) * 15 * 60000),
      },
    });
    tickets.push(ticket);

    await prisma.queueEntry.create({
      data: {
        ticketId: ticket.id,
        station: scenario.station,
        position: i + 1,
        status: scenario.queueStatus,
        calledAt: scenario.queueStatus !== QueueStatus.WAITING ? new Date() : null,
        startedAt: scenario.queueStatus === QueueStatus.IN_SERVICE || scenario.queueStatus === QueueStatus.COMPLETED ? new Date() : null,
        completedAt: scenario.queueStatus === QueueStatus.COMPLETED ? new Date() : null,
      },
    });

    // Marquer les patients qui doivent avoir un test de vue
    if (scenario.hasVisionTest) {
      patientsWithVisionTest.push(patient.id);
    }
    // Marquer les patients qui doivent avoir une consultation
    if ((scenario as any).hasConsultation) {
      patientsWithConsultation.push(patient.id);
    }
  }
  console.log(`✅ ${tickets.length} tickets créés`);

  // ============================================
  // TESTS DE VUE (uniquement pour les patients qui ont passé le test)
  // ============================================
  console.log('\n👁️ Création des tests de vue...');
  
  let visionTestCount = 0;
  for (const patientId of patientsWithVisionTest) {
    await prisma.visionTest.create({
      data: {
        patientId: patientId,
        technicianId: testVue.id,
        rightEye_sphere: Math.round((-1.5 + Math.random() * 3) * 100) / 100,
        rightEye_cylinder: Math.round((-0.5 + Math.random()) * 100) / 100,
        rightEye_axis: Math.floor(Math.random() * 180),
        rightEye_acuity: ['10/10', '8/10', '6/10', '4/10'][Math.floor(Math.random() * 4)],
        leftEye_sphere: Math.round((-1.5 + Math.random() * 3) * 100) / 100,
        leftEye_cylinder: Math.round((-0.5 + Math.random()) * 100) / 100,
        leftEye_axis: Math.floor(Math.random() * 180),
        leftEye_acuity: ['10/10', '8/10', '6/10', '4/10'][Math.floor(Math.random() * 4)],
        pupillaryDistance: Math.round((60 + Math.random() * 10) * 10) / 10,
        notes: 'Test effectué dans des conditions normales.',
      },
    });
    visionTestCount++;
  }
  console.log(`✅ ${visionTestCount} tests de vue créés`);

  // ============================================
  // CONSULTATIONS (uniquement pour les patients terminés)
  // ============================================
  console.log('\n🩺 Création des consultations...');
  
  const diagnoses = [
    'Myopie légère',
    'Hypermétropie',
    'Astigmatisme',
    'Presbytie',
    'Cataracte débutante',
  ];

  let consultationCount = 0;
  for (let i = 0; i < patientsWithConsultation.length; i++) {
    const patientId = patientsWithConsultation[i];
    const consultation = await prisma.consultation.create({
      data: {
        patientId: patientId,
        doctorId: medecin.id,
        chiefComplaint: 'Vision floue de loin',
        diagnosis: diagnoses[i % diagnoses.length],
        notes: 'Patient coopératif. Examen sans particularité.',
        intraocularPressureOD: Math.round((14 + Math.random() * 4) * 10) / 10,
        intraocularPressureOG: Math.round((14 + Math.random() * 4) * 10) / 10,
      },
    });

    // Ajouter des prescriptions
    await prisma.prescription.create({
      data: {
        consultationId: consultation.id,
        eyeType: EyeType.OD,
        sphere: -1.5 + Math.random() * 2,
        cylinder: -0.5,
        axis: 90,
        lensType: 'Organique',
        coating: 'Anti-reflet',
      },
    });

    await prisma.prescription.create({
      data: {
        consultationId: consultation.id,
        eyeType: EyeType.OG,
        sphere: -1.25 + Math.random() * 2,
        cylinder: -0.25,
        axis: 85,
        lensType: 'Organique',
        coating: 'Anti-reflet',
      },
    });

    consultationCount++;
  }
  console.log(`✅ ${consultationCount} consultations créées`);

  // ============================================
  // RÉSUMÉ
  // ============================================
  console.log('\n');
  console.log('🎉 ═══════════════════════════════════════════════════');
  console.log('   SEEDING TERMINÉ AVEC SUCCÈS!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('📋 Comptes utilisateurs:');
  console.log('   Admin:     admin@camg-bopp.sn / admin123');
  console.log('   Accueil:   accueil@camg-bopp.sn / accueil123');
  console.log('   Test Vue:  testvue@camg-bopp.sn / testvue123');
  console.log('   Médecin:   medecin@camg-bopp.sn / medecin123');
  console.log('');
  console.log('📊 Données créées:');
  console.log(`   - ${patients.length} patients`);
  console.log(`   - ${tickets.length} tickets`);
  console.log(`   - ${visionTestCount} tests de vue`);
  console.log(`   - ${consultationCount} consultations`);
  console.log('═══════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
