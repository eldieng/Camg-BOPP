# 🗄️ Schéma de Base de Données - CAMG-BOPP

## Vue d'Ensemble

Ce document décrit le modèle de données complet pour le système de gestion des patients et files d'attente du dispensaire ophtalmologique CAMG-BOPP.

---

## Diagramme Entité-Relation

```
┌──────────────────┐
│       User       │
├──────────────────┤
│ id               │
│ email            │
│ password         │
│ firstName        │
│ lastName         │
│ role             │
│ isActive         │
│ createdAt        │
│ updatedAt        │
└────────┬─────────┘
         │
         │ 1:N (médecin)
         ▼
┌──────────────────┐       ┌──────────────────┐
│   Consultation   │──────>│   Prescription   │
├──────────────────┤  1:N  ├──────────────────┤
│ id               │       │ id               │
│ patientId        │       │ consultationId   │
│ doctorId         │       │ eyeType          │
│ diagnosis        │       │ sphere           │
│ notes            │       │ cylinder         │
│ createdAt        │       │ axis             │
└────────┬─────────┘       │ addition         │
         │                 │ notes            │
         │                 │ createdAt        │
         │                 └──────────────────┘
         │
         │ N:1
         ▼
┌──────────────────┐       ┌──────────────────┐
│     Patient      │<──────│     Ticket       │
├──────────────────┤  1:N  ├──────────────────┤
│ id               │       │ id               │
│ firstName        │       │ patientId        │
│ lastName         │       │ ticketNumber     │
│ dateOfBirth      │       │ qrCode           │
│ gender           │       │ priority         │
│ address          │       │ priorityReason   │
│ phone            │       │ status           │
│ emergencyContact │       │ createdAt        │
│ isPregnant       │       └────────┬─────────┘
│ isDisabled       │                │
│ createdAt        │                │ 1:1
│ updatedAt        │                ▼
└────────┬─────────┘       ┌──────────────────┐
         │                 │   QueueEntry     │
         │                 ├──────────────────┤
         │                 │ id               │
         │                 │ ticketId         │
         │                 │ station          │
         │                 │ position         │
         │                 │ status           │
         │                 │ calledAt         │
         │                 │ completedAt      │
         │                 └──────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│    VisionTest    │
├──────────────────┤
│ id               │
│ patientId        │
│ technicianId     │
│ rightEye_*       │
│ leftEye_*        │
│ notes            │
│ createdAt        │
└──────────────────┘
```

---

## Schéma Prisma Complet

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ÉNUMÉRATIONS
// ============================================

enum UserRole {
  ACCUEIL
  TEST_VUE
  MEDECIN
  ADMIN
}

enum Gender {
  MALE
  FEMALE
}

enum TicketStatus {
  WAITING        // En attente
  IN_PROGRESS    // En cours de traitement
  COMPLETED      // Terminé
  CANCELLED      // Annulé
  NO_SHOW        // Patient absent
}

enum Priority {
  NORMAL
  ELDERLY        // Personne âgée (65+)
  PREGNANT       // Femme enceinte
  DISABLED       // Personne handicapée
  EMERGENCY      // Urgence médicale
}

enum Station {
  ACCUEIL        // Accueil
  TEST_VUE       // Salle test de vue
  CONSULTATION   // Consultation médecin
  LUNETTES       // Salle des lunettes
}

enum QueueStatus {
  WAITING        // En attente dans la file
  CALLED         // Appelé
  IN_SERVICE     // En cours de service
  COMPLETED      // Service terminé
  SKIPPED        // Passé (absent)
}

enum EyeType {
  OD             // Œil Droit
  OG             // Œil Gauche
}

// ============================================
// MODÈLES
// ============================================

/// Utilisateurs du système (personnel médical et administratif)
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String    // Hashé avec bcrypt
  firstName     String
  lastName      String
  role          UserRole
  isActive      Boolean   @default(true)
  lastLogin     DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  consultations Consultation[] @relation("DoctorConsultations")
  visionTests   VisionTest[]   @relation("TechnicianTests")

  @@map("users")
}

/// Patients du dispensaire
model Patient {
  id               String    @id @default(uuid())
  firstName        String
  lastName         String
  dateOfBirth      DateTime
  gender           Gender
  address          String?
  phone            String?
  emergencyContact String?   // Contact d'urgence
  isPregnant       Boolean   @default(false)
  isDisabled       Boolean   @default(false)
  notes            String?   // Notes générales
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  // Relations
  tickets       Ticket[]
  visionTests   VisionTest[]
  consultations Consultation[]
  appointments  Appointment[]

  @@index([lastName, firstName])
  @@index([phone])
  @@map("patients")
}

/// Tickets de passage
model Ticket {
  id             String       @id @default(uuid())
  ticketNumber   String       @unique // Format: YYYYMMDD-XXX
  qrCode         String       @unique // Code unique pour QR
  patientId      String
  priority       Priority     @default(NORMAL)
  priorityReason String?      // Raison de la priorité
  status         TicketStatus @default(WAITING)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  // Relations
  patient    Patient     @relation(fields: [patientId], references: [id])
  queueEntry QueueEntry?

  @@index([createdAt])
  @@index([status])
  @@map("tickets")
}

/// Entrées dans la file d'attente
model QueueEntry {
  id          String      @id @default(uuid())
  ticketId    String      @unique
  station     Station     // Station actuelle
  position    Int         // Position dans la file
  status      QueueStatus @default(WAITING)
  calledAt    DateTime?   // Heure d'appel
  startedAt   DateTime?   // Début du service
  completedAt DateTime?   // Fin du service
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relations
  ticket Ticket @relation(fields: [ticketId], references: [id])

  @@index([station, status])
  @@index([position])
  @@map("queue_entries")
}

/// Tests de vision
model VisionTest {
  id           String   @id @default(uuid())
  patientId    String
  technicianId String
  
  // Œil Droit (OD)
  rightEye_sphere    Float?
  rightEye_cylinder  Float?
  rightEye_axis      Int?
  rightEye_acuity    String?  // Ex: "10/10", "8/10"
  rightEye_addition  Float?
  
  // Œil Gauche (OG)
  leftEye_sphere     Float?
  leftEye_cylinder   Float?
  leftEye_axis       Int?
  leftEye_acuity     String?
  leftEye_addition   Float?
  
  // Autres mesures
  pupillaryDistance  Float?   // Distance pupillaire (mm)
  notes              String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  patient    Patient @relation(fields: [patientId], references: [id])
  technician User    @relation("TechnicianTests", fields: [technicianId], references: [id])

  @@index([patientId])
  @@index([createdAt])
  @@map("vision_tests")
}

/// Consultations médicales
model Consultation {
  id        String   @id @default(uuid())
  patientId String
  doctorId  String
  
  // Diagnostic
  chiefComplaint String?  // Motif de consultation
  diagnosis      String?
  notes          String?
  
  // Examen
  intraocularPressureOD Float? // Pression intraoculaire OD
  intraocularPressureOG Float? // Pression intraoculaire OG
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  patient       Patient        @relation(fields: [patientId], references: [id])
  doctor        User           @relation("DoctorConsultations", fields: [doctorId], references: [id])
  prescriptions Prescription[]

  @@index([patientId])
  @@index([doctorId])
  @@index([createdAt])
  @@map("consultations")
}

/// Prescriptions / Ordonnances
model Prescription {
  id             String  @id @default(uuid())
  consultationId String
  
  // Correction optique
  eyeType        EyeType
  sphere         Float?
  cylinder       Float?
  axis           Int?
  addition       Float?
  
  // Type de verre
  lensType       String? // Unifocal, Progressif, etc.
  coating        String? // Anti-reflet, Photochromique, etc.
  
  // Médicaments
  medication     String?
  dosage         String?
  duration       String?
  
  notes          String?
  
  createdAt DateTime @default(now())

  // Relations
  consultation Consultation @relation(fields: [consultationId], references: [id])

  @@map("prescriptions")
}

/// Rendez-vous
model Appointment {
  id            String   @id @default(uuid())
  patientId     String
  scheduledDate DateTime
  scheduledTime String   // Format: "HH:mm"
  reason        String?
  status        String   @default("SCHEDULED") // SCHEDULED, CONFIRMED, CANCELLED, COMPLETED
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  patient Patient @relation(fields: [patientId], references: [id])

  @@index([scheduledDate])
  @@index([patientId])
  @@map("appointments")
}

/// Statistiques journalières (pré-calculées)
model DailyStats {
  id                  String   @id @default(uuid())
  date                DateTime @unique
  totalPatients       Int      @default(0)
  totalTickets        Int      @default(0)
  completedTickets    Int      @default(0)
  cancelledTickets    Int      @default(0)
  avgWaitTimeMinutes  Float?
  avgServiceTimeMinutes Float?
  consultationsByDoctor Json?  // { "doctorId": count }
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@map("daily_stats")
}

/// Journal d'audit
model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  action    String   // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
  entity    String   // Patient, Ticket, Consultation, etc.
  entityId  String?
  details   Json?
  ipAddress String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
  @@index([entity])
  @@map("audit_logs")
}
```

---

## Description des Tables

### 1. `users` - Utilisateurs

Stocke les informations des utilisateurs du système.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `email` | String | Email de connexion (unique) |
| `password` | String | Mot de passe hashé (bcrypt) |
| `firstName` | String | Prénom |
| `lastName` | String | Nom |
| `role` | Enum | ACCUEIL, TEST_VUE, MEDECIN, ADMIN |
| `isActive` | Boolean | Compte actif ou désactivé |

### 2. `patients` - Patients

Dossier patient complet.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `firstName` | String | Prénom |
| `lastName` | String | Nom |
| `dateOfBirth` | DateTime | Date de naissance |
| `gender` | Enum | MALE, FEMALE |
| `address` | String? | Adresse |
| `phone` | String? | Téléphone |
| `isPregnant` | Boolean | Femme enceinte (priorité) |
| `isDisabled` | Boolean | Personne handicapée (priorité) |

### 3. `tickets` - Tickets de passage

Tickets générés pour chaque visite.

| Champ | Type | Description |
|-------|------|-------------|
| `ticketNumber` | String | Numéro unique (YYYYMMDD-XXX) |
| `qrCode` | String | Code pour QR code |
| `priority` | Enum | NORMAL, ELDERLY, PREGNANT, etc. |
| `status` | Enum | WAITING, IN_PROGRESS, COMPLETED |

### 4. `queue_entries` - File d'attente

Gestion de la position dans la file.

| Champ | Type | Description |
|-------|------|-------------|
| `station` | Enum | ACCUEIL, TEST_VUE, CONSULTATION |
| `position` | Int | Position dans la file |
| `status` | Enum | WAITING, CALLED, IN_SERVICE |
| `calledAt` | DateTime? | Heure d'appel |

### 5. `vision_tests` - Tests de vue

Résultats des examens visuels.

| Champ | Type | Description |
|-------|------|-------------|
| `rightEye_*` | Float/Int | Mesures œil droit |
| `leftEye_*` | Float/Int | Mesures œil gauche |
| `pupillaryDistance` | Float? | Distance pupillaire |

### 6. `consultations` - Consultations

Consultations médicales.

| Champ | Type | Description |
|-------|------|-------------|
| `diagnosis` | String? | Diagnostic |
| `chiefComplaint` | String? | Motif de consultation |
| `intraocularPressure*` | Float? | Pression intraoculaire |

### 7. `prescriptions` - Ordonnances

Prescriptions optiques et médicamenteuses.

| Champ | Type | Description |
|-------|------|-------------|
| `eyeType` | Enum | OD (droit) ou OG (gauche) |
| `sphere`, `cylinder`, `axis` | Float/Int | Correction optique |
| `medication` | String? | Médicament prescrit |

---

## Index et Performances

### Index Principaux

```sql
-- Recherche patients
CREATE INDEX idx_patients_name ON patients(lastName, firstName);
CREATE INDEX idx_patients_phone ON patients(phone);

-- File d'attente
CREATE INDEX idx_queue_station_status ON queue_entries(station, status);
CREATE INDEX idx_queue_position ON queue_entries(position);

-- Tickets du jour
CREATE INDEX idx_tickets_created ON tickets(createdAt);
CREATE INDEX idx_tickets_status ON tickets(status);

-- Historique patient
CREATE INDEX idx_consultations_patient ON consultations(patientId);
CREATE INDEX idx_vision_tests_patient ON vision_tests(patientId);
```

---

## Migrations Initiales

### Création de la base

```bash
# Initialiser Prisma
npx prisma init

# Créer la migration initiale
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate
```

### Seed Initial (Données de test)

```typescript
// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Créer l'administrateur par défaut
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@camg-bopp.sn' },
    update: {},
    create: {
      email: 'admin@camg-bopp.sn',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'CAMG-BOPP',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Sauvegardes

### Script de sauvegarde quotidienne

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/camg-bopp"
DB_NAME="camg_bopp"

# Créer le répertoire si nécessaire
mkdir -p $BACKUP_DIR

# Sauvegarde PostgreSQL
pg_dump $DB_NAME > "$BACKUP_DIR/backup_$DATE.sql"

# Compression
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Supprimer les sauvegardes de plus de 30 jours
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

---

*Document technique - Version 1.0*
