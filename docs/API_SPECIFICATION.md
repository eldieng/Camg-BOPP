# 📡 Spécification API REST - CAMG-BOPP

## Vue d'Ensemble

API RESTful pour le système de gestion des patients et files d'attente.

**Base URL**: `http://localhost:3000/api`

**Format**: JSON

**Authentification**: JWT Bearer Token

---

## 🔐 Authentification

### POST `/auth/login`

Connexion utilisateur.

**Body:**
```json
{
  "email": "medecin@camg-bopp.sn",
  "password": "motdepasse123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "medecin@camg-bopp.sn",
      "firstName": "Dr. Amadou",
      "lastName": "Diallo",
      "role": "MEDECIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

**Response 401:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou mot de passe incorrect"
  }
}
```

### POST `/auth/logout`

Déconnexion (invalidation du token).

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

### GET `/auth/me`

Informations utilisateur connecté.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "medecin@camg-bopp.sn",
    "firstName": "Dr. Amadou",
    "lastName": "Diallo",
    "role": "MEDECIN",
    "lastLogin": "2024-12-09T10:30:00Z"
  }
}
```

---

## 👥 Patients

### GET `/patients`

Liste des patients avec pagination et recherche.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page (défaut: 1) |
| `limit` | number | Résultats par page (défaut: 20, max: 100) |
| `search` | string | Recherche nom/prénom/téléphone |
| `sortBy` | string | Champ de tri (défaut: createdAt) |
| `sortOrder` | string | asc ou desc (défaut: desc) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": "uuid",
        "firstName": "Fatou",
        "lastName": "Ndiaye",
        "dateOfBirth": "1985-03-15",
        "gender": "FEMALE",
        "phone": "+221771234567",
        "createdAt": "2024-12-01T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### GET `/patients/:id`

Détail d'un patient avec historique.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Fatou",
    "lastName": "Ndiaye",
    "dateOfBirth": "1985-03-15",
    "gender": "FEMALE",
    "address": "Dakar, Médina",
    "phone": "+221771234567",
    "emergencyContact": "+221771234568",
    "isPregnant": false,
    "isDisabled": false,
    "createdAt": "2024-12-01T09:00:00Z",
    "stats": {
      "totalVisits": 5,
      "lastVisit": "2024-12-05T14:30:00Z"
    }
  }
}
```

### POST `/patients`

Créer un nouveau patient.

**Body:**
```json
{
  "firstName": "Moussa",
  "lastName": "Diop",
  "dateOfBirth": "1990-07-22",
  "gender": "MALE",
  "address": "Dakar, Parcelles Assainies",
  "phone": "+221771234569",
  "emergencyContact": "+221771234570",
  "isPregnant": false,
  "isDisabled": false
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Moussa",
    "lastName": "Diop",
    ...
  }
}
```

### PUT `/patients/:id`

Modifier un patient.

**Body:** (champs à modifier uniquement)
```json
{
  "phone": "+221771234571",
  "address": "Dakar, Almadies"
}
```

### GET `/patients/:id/history`

Historique médical complet d'un patient.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "patient": { ... },
    "visionTests": [
      {
        "id": "uuid",
        "createdAt": "2024-12-05T10:00:00Z",
        "rightEye_acuity": "8/10",
        "leftEye_acuity": "9/10",
        "technician": "Aminata Sow"
      }
    ],
    "consultations": [
      {
        "id": "uuid",
        "createdAt": "2024-12-05T11:00:00Z",
        "diagnosis": "Myopie légère",
        "doctor": "Dr. Amadou Diallo",
        "prescriptions": [...]
      }
    ]
  }
}
```

---

## 🎫 Tickets

### POST `/tickets`

Générer un nouveau ticket.

**Body:**
```json
{
  "patientId": "uuid",
  "priority": "NORMAL",
  "priorityReason": null
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticketNumber": "20241209-001",
    "qrCode": "CAMG-ABC123XYZ",
    "priority": "NORMAL",
    "status": "WAITING",
    "patient": {
      "firstName": "Moussa",
      "lastName": "Diop"
    },
    "estimatedWaitTime": 25,
    "position": 5,
    "createdAt": "2024-12-09T08:30:00Z"
  }
}
```

### GET `/tickets/today`

Tickets du jour.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filtrer par statut |
| `priority` | string | Filtrer par priorité |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "tickets": [...],
    "summary": {
      "total": 45,
      "waiting": 12,
      "inProgress": 3,
      "completed": 28,
      "cancelled": 2
    }
  }
}
```

### GET `/tickets/:id`

Détail d'un ticket.

### PUT `/tickets/:id/status`

Changer le statut d'un ticket.

**Body:**
```json
{
  "status": "COMPLETED"
}
```

### GET `/tickets/by-qr/:qrCode`

Rechercher un ticket par QR code.

---

## 📋 File d'Attente (Queue)

### GET `/queue`

État actuel de la file d'attente.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `station` | string | ACCUEIL, TEST_VUE, CONSULTATION |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "currentlyServing": {
      "ticketNumber": "20241209-015",
      "patientName": "Fatou N.",
      "station": "CONSULTATION",
      "calledAt": "2024-12-09T10:45:00Z"
    },
    "waiting": [
      {
        "position": 1,
        "ticketNumber": "20241209-016",
        "patientName": "Moussa D.",
        "priority": "ELDERLY",
        "waitingSince": "2024-12-09T10:30:00Z"
      }
    ],
    "stats": {
      "totalWaiting": 8,
      "avgWaitTime": 15,
      "estimatedWaitTime": 20
    }
  }
}
```

### GET `/queue/display`

Données pour l'écran d'affichage public.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "currentNumbers": {
      "TEST_VUE": "20241209-014",
      "CONSULTATION": "20241209-015"
    },
    "nextNumbers": [
      "20241209-016",
      "20241209-017",
      "20241209-018"
    ],
    "announcement": {
      "ticketNumber": "20241209-016",
      "station": "TEST_VUE",
      "message": "Numéro 016, salle de test de vue"
    }
  }
}
```

### POST `/queue/call-next`

Appeler le prochain patient.

**Body:**
```json
{
  "station": "CONSULTATION"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "ticketNumber": "20241209-016",
      "patient": {
        "firstName": "Moussa",
        "lastName": "Diop"
      }
    },
    "message": "Patient appelé avec succès"
  }
}
```

### PUT `/queue/:ticketId/complete`

Marquer un patient comme servi.

### PUT `/queue/:ticketId/skip`

Passer un patient (absent).

---

## 👁️ Tests de Vue

### POST `/vision-tests`

Enregistrer un test de vue.

**Body:**
```json
{
  "patientId": "uuid",
  "rightEye_sphere": -1.25,
  "rightEye_cylinder": -0.50,
  "rightEye_axis": 90,
  "rightEye_acuity": "8/10",
  "leftEye_sphere": -1.00,
  "leftEye_cylinder": -0.25,
  "leftEye_axis": 85,
  "leftEye_acuity": "9/10",
  "pupillaryDistance": 63.5,
  "notes": "Patient coopératif"
}
```

### GET `/vision-tests/patient/:patientId`

Historique des tests d'un patient.

### GET `/vision-tests/:id`

Détail d'un test.

### PUT `/vision-tests/:id`

Modifier un test.

---

## 🩺 Consultations

### POST `/consultations`

Créer une consultation.

**Body:**
```json
{
  "patientId": "uuid",
  "chiefComplaint": "Vision floue de loin",
  "diagnosis": "Myopie bilatérale",
  "notes": "Prescription de verres correcteurs recommandée",
  "intraocularPressureOD": 14,
  "intraocularPressureOG": 15
}
```

### GET `/consultations/:id`

Détail d'une consultation.

### GET `/consultations/patient/:patientId`

Consultations d'un patient.

### GET `/consultations/doctor/:doctorId`

Consultations d'un médecin.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `date` | string | Date (YYYY-MM-DD) |
| `from` | string | Date début |
| `to` | string | Date fin |

---

## 💊 Prescriptions

### POST `/prescriptions`

Créer une prescription.

**Body:**
```json
{
  "consultationId": "uuid",
  "items": [
    {
      "eyeType": "OD",
      "sphere": -1.25,
      "cylinder": -0.50,
      "axis": 90,
      "addition": null,
      "lensType": "Unifocal",
      "coating": "Anti-reflet"
    },
    {
      "eyeType": "OG",
      "sphere": -1.00,
      "cylinder": -0.25,
      "axis": 85,
      "addition": null,
      "lensType": "Unifocal",
      "coating": "Anti-reflet"
    }
  ],
  "medications": [
    {
      "name": "Collyre hydratant",
      "dosage": "1 goutte 3x/jour",
      "duration": "7 jours"
    }
  ],
  "notes": "Contrôle dans 6 mois"
}
```

### GET `/prescriptions/:id`

Détail d'une prescription.

### GET `/prescriptions/:id/print`

Générer PDF de l'ordonnance.

**Response:** PDF file (application/pdf)

---

## 📅 Rendez-vous

### POST `/appointments`

Créer un rendez-vous.

**Body:**
```json
{
  "patientId": "uuid",
  "scheduledDate": "2024-12-15",
  "scheduledTime": "10:30",
  "reason": "Contrôle annuel"
}
```

### GET `/appointments`

Liste des rendez-vous.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `date` | string | Date spécifique |
| `from` | string | Date début |
| `to` | string | Date fin |
| `status` | string | SCHEDULED, CONFIRMED, CANCELLED |

### PUT `/appointments/:id`

Modifier un rendez-vous.

### DELETE `/appointments/:id`

Annuler un rendez-vous.

---

## 👤 Utilisateurs (Admin)

### GET `/users`

Liste des utilisateurs.

**Rôle requis:** ADMIN

### POST `/users`

Créer un utilisateur.

**Body:**
```json
{
  "email": "nouveau@camg-bopp.sn",
  "password": "motdepasse123",
  "firstName": "Nouveau",
  "lastName": "Utilisateur",
  "role": "TEST_VUE"
}
```

### PUT `/users/:id`

Modifier un utilisateur.

### DELETE `/users/:id`

Désactiver un utilisateur.

### PUT `/users/:id/password`

Changer le mot de passe.

**Body:**
```json
{
  "currentPassword": "ancien",
  "newPassword": "nouveau123"
}
```

---

## 📊 Statistiques (Admin)

### GET `/stats/dashboard`

Données du tableau de bord.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `period` | string | today, week, month, year |
| `from` | string | Date début personnalisée |
| `to` | string | Date fin personnalisée |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "period": "today",
    "patients": {
      "total": 45,
      "new": 12,
      "returning": 33
    },
    "tickets": {
      "total": 48,
      "completed": 35,
      "waiting": 8,
      "cancelled": 5
    },
    "waitTime": {
      "average": 18,
      "min": 5,
      "max": 45
    },
    "consultations": {
      "total": 32,
      "byDoctor": [
        { "doctor": "Dr. Diallo", "count": 18 },
        { "doctor": "Dr. Sow", "count": 14 }
      ]
    },
    "revenue": {
      "estimated": 450000,
      "currency": "XOF"
    }
  }
}
```

### GET `/stats/export`

Exporter les données.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `format` | string | excel, pdf |
| `type` | string | patients, consultations, stats |
| `from` | string | Date début |
| `to` | string | Date fin |

**Response:** File download

---

## 🔌 WebSocket Events

### Connexion

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'jwt_token' }
});
```

### Événements Émis (Server → Client)

| Event | Description | Payload |
|-------|-------------|---------|
| `queue:updated` | File mise à jour | `{ station, queue }` |
| `queue:called` | Patient appelé | `{ ticketNumber, station }` |
| `queue:completed` | Patient servi | `{ ticketNumber }` |
| `ticket:created` | Nouveau ticket | `{ ticket }` |

### Événements Reçus (Client → Server)

| Event | Description | Payload |
|-------|-------------|---------|
| `queue:subscribe` | S'abonner à une station | `{ station }` |
| `queue:unsubscribe` | Se désabonner | `{ station }` |

---

## ⚠️ Codes d'Erreur

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Données invalides |
| `INVALID_CREDENTIALS` | 401 | Identifiants incorrects |
| `UNAUTHORIZED` | 401 | Non authentifié |
| `FORBIDDEN` | 403 | Accès refusé |
| `NOT_FOUND` | 404 | Ressource non trouvée |
| `CONFLICT` | 409 | Conflit (doublon) |
| `INTERNAL_ERROR` | 500 | Erreur serveur |

### Format d'Erreur

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Les données fournies sont invalides",
    "details": [
      {
        "field": "email",
        "message": "Format email invalide"
      }
    ]
  }
}
```

---

## 🔒 Permissions par Rôle

| Endpoint | ACCUEIL | TEST_VUE | MEDECIN | ADMIN |
|----------|---------|----------|---------|-------|
| `POST /patients` | ✅ | ❌ | ✅ | ✅ |
| `GET /patients` | ✅ | ✅ | ✅ | ✅ |
| `POST /tickets` | ✅ | ❌ | ❌ | ✅ |
| `POST /queue/call-next` | ✅ | ✅ | ✅ | ✅ |
| `POST /vision-tests` | ❌ | ✅ | ✅ | ✅ |
| `POST /consultations` | ❌ | ❌ | ✅ | ✅ |
| `POST /prescriptions` | ❌ | ❌ | ✅ | ✅ |
| `GET /stats/*` | ❌ | ❌ | ❌ | ✅ |
| `*/users/*` | ❌ | ❌ | ❌ | ✅ |

---

*Documentation API - Version 1.0*
