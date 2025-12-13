# 🏥 CAMG-BOPP - Système de Gestion des Patients et Files d'Attente

## Dispensaire Ophtalmologique CAMG-BOPP

---

## 📋 Table des Matières

1. [Présentation du Projet](#présentation-du-projet)
2. [Architecture Technique](#architecture-technique)
3. [Phases de Développement](#phases-de-développement)
4. [Structure du Projet](#structure-du-projet)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Utilisation](#utilisation)

---

## 🎯 Présentation du Projet

### Contexte

Le dispensaire ophtalmologique CAMG-BOPP fonctionne actuellement avec des méthodes manuelles (tickets papiers, registres manuscrits) entraînant :
- Désorganisation et temps d'attente excessifs
- Conflits entre patients
- Absence d'historique médical numérique
- Impossibilité d'exploiter les données

### Objectifs

- **Digitaliser** la file d'attente avec priorités automatiques
- **Créer** des dossiers patients numériques sécurisés
- **Optimiser** l'organisation interne
- **Améliorer** l'expérience patient
- **Disposer** de statistiques fiables

---

## 🏗️ Architecture Technique

### Stack Technologique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React JS, TypeScript, Vite, TailwindCSS |
| **Backend** | Node.js, Express.js, TypeScript |
| **Base de données** | PostgreSQL + Prisma ORM |
| **Authentification** | JWT + Bcrypt |

### Schéma d'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────┤
│   Accueil   │  Test Vue   │   Médecin   │    Admin    │  Écran  │
│  Interface  │  Interface  │  Interface  │  Interface  │  Public │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴────┬────┘
       │             │             │             │           │
       └─────────────┴─────────────┴─────────────┴───────────┘
                                   │
                          ┌────────▼────────┐
                          │   API REST      │
                          │   Express.js    │
                          └────────┬────────┘
                                   │
                          ┌────────▼────────┐
                          │   PostgreSQL    │
                          │   + Prisma ORM  │
                          └─────────────────┘
```

### Rôles Utilisateurs

| Rôle | Accès |
|------|-------|
| `ACCUEIL` | Enregistrement patients, génération tickets |
| `TEST_VUE` | Saisie résultats tests visuels |
| `MEDECIN` | Consultations, diagnostics, ordonnances |
| `ADMIN` | Tableau de bord, statistiques, gestion utilisateurs |

---

## 📅 Phases de Développement

### 🔵 PHASE 1 : Fondations (Semaines 1-2)

**Objectif** : Mettre en place l'infrastructure de base

#### Backend
- [ ] Initialisation projet Node.js/Express/TypeScript
- [ ] Configuration Prisma + PostgreSQL
- [ ] Modèles de données (Patient, User, Ticket)
- [ ] Système d'authentification JWT
- [ ] Middleware de sécurité et gestion des rôles

#### Frontend
- [ ] Initialisation projet React/Vite/TypeScript
- [ ] Configuration TailwindCSS
- [ ] Composants UI de base
- [ ] Page de connexion
- [ ] Routing et protection des routes

#### Livrables Phase 1
- API d'authentification fonctionnelle
- Interface de connexion
- Base de données initialisée

---

### 🟢 PHASE 2 : Module Accueil & Tickets (Semaines 3-4)

**Objectif** : Digitaliser l'enregistrement et la génération de tickets

#### Fonctionnalités
- [ ] Formulaire d'enregistrement patient
  - Nom, Prénom, Âge, Adresse, Téléphone
- [ ] Génération automatique numéro de passage
- [ ] Génération QR Code unique
- [ ] Impression ticket (optionnel)
- [ ] Recherche patient existant
- [ ] Gestion des rendez-vous

#### API Endpoints
```
POST   /api/patients          - Créer patient
GET    /api/patients          - Liste patients
GET    /api/patients/:id      - Détail patient
PUT    /api/patients/:id      - Modifier patient
POST   /api/tickets           - Générer ticket
GET    /api/tickets/today     - Tickets du jour
```

#### Livrables Phase 2
- Interface accueil complète
- Système de tickets fonctionnel
- Base patients opérationnelle

---

### 🟡 PHASE 3 : File d'Attente Intelligente (Semaines 5-6)

**Objectif** : Automatiser la gestion des files d'attente avec priorités

#### Fonctionnalités
- [ ] Algorithme de priorité automatique
  - Personnes âgées (65+)
  - Urgences médicales
  - Personnes handicapées
  - Femmes enceintes
- [ ] Écran d'affichage public
  - Numéro en cours
  - Salle concernée
  - Prochains numéros
- [ ] Appel sonore automatique
- [ ] Temps d'attente estimé
- [ ] WebSocket pour mise à jour temps réel

#### API Endpoints
```
GET    /api/queue              - État file d'attente
POST   /api/queue/call-next    - Appeler suivant
PUT    /api/queue/:id/status   - Changer statut
GET    /api/queue/display      - Données écran public
WS     /ws/queue               - Temps réel
```

#### Livrables Phase 3
- File d'attente intelligente
- Écran d'affichage public
- Système de priorités

---

### 🟠 PHASE 4 : Module Test de Vue (Semaines 7-8)

**Objectif** : Numériser les tests visuels

#### Fonctionnalités
- [ ] Interface saisie résultats
  - Œil Droit (OD)
  - Œil Gauche (OG)
  - Observations
- [ ] Liaison automatique dossier patient
- [ ] Historique des tests
- [ ] Validation et transfert vers médecin

#### API Endpoints
```
POST   /api/tests              - Créer test
GET    /api/tests/patient/:id  - Tests d'un patient
PUT    /api/tests/:id          - Modifier test
```

#### Livrables Phase 4
- Interface test de vue
- Historique consultable
- Workflow accueil → test → médecin

---

### 🔴 PHASE 5 : Module Consultation Médicale (Semaines 9-10)

**Objectif** : Digitaliser les consultations et ordonnances

#### Fonctionnalités
- [ ] Accès complet dossier patient
- [ ] Visualisation historique médical
- [ ] Saisie diagnostic numérique
- [ ] Génération ordonnance
- [ ] Impression ordonnance
- [ ] Liaison salle des lunettes

#### API Endpoints
```
POST   /api/consultations           - Créer consultation
GET    /api/consultations/:id       - Détail consultation
GET    /api/patients/:id/history    - Historique patient
POST   /api/prescriptions           - Créer ordonnance
GET    /api/prescriptions/:id/print - Imprimer ordonnance
```

#### Livrables Phase 5
- Interface médecin complète
- Système d'ordonnances
- Historique médical complet

---

### 🟣 PHASE 6 : Administration & Statistiques (Semaines 11-12)

**Objectif** : Tableau de bord et outils de gestion

#### Fonctionnalités
- [ ] Tableau de bord direction
  - Patients par jour/semaine/mois
  - Temps moyen d'attente
  - Consultations par médecin
  - Recettes estimées
- [ ] Gestion des utilisateurs
- [ ] Export données (Excel/PDF)
- [ ] Archivage automatique
- [ ] Sauvegarde base de données

#### API Endpoints
```
GET    /api/stats/dashboard    - Données tableau de bord
GET    /api/stats/export       - Export données
GET    /api/users              - Liste utilisateurs
POST   /api/users              - Créer utilisateur
PUT    /api/users/:id          - Modifier utilisateur
DELETE /api/users/:id          - Supprimer utilisateur
```

#### Livrables Phase 6
- Tableau de bord complet
- Exports fonctionnels
- Gestion utilisateurs

---

### ⚫ PHASE 7 : Tests, Déploiement & Formation (Semaines 13-14)

**Objectif** : Finalisation et mise en production

#### Activités
- [ ] Tests unitaires et d'intégration
- [ ] Tests utilisateurs
- [ ] Correction bugs
- [ ] Documentation utilisateur
- [ ] Formation du personnel
- [ ] Déploiement serveur local/VPS
- [ ] Configuration sauvegardes automatiques

#### Livrables Phase 7
- Application testée et validée
- Documentation complète
- Personnel formé
- Système en production

---

## 📁 Structure du Projet

```
CAMG-BOPP/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Logique métier
│   │   ├── middleware/       # Auth, validation
│   │   ├── routes/           # Définition routes API
│   │   ├── services/         # Services métier
│   │   ├── utils/            # Utilitaires
│   │   └── index.ts          # Point d'entrée
│   ├── prisma/
│   │   ├── schema.prisma     # Schéma BDD
│   │   └── migrations/       # Migrations
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   ├── pages/            # Pages de l'application
│   │   ├── hooks/            # Hooks personnalisés
│   │   ├── services/         # Appels API
│   │   ├── store/            # État global
│   │   ├── types/            # Types TypeScript
│   │   └── App.tsx           # Composant racine
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   ├── api.md                # Documentation API
│   ├── user-guide.md         # Guide utilisateur
│   └── deployment.md         # Guide déploiement
│
├── docker-compose.yml        # Configuration Docker
├── .env.example              # Variables d'environnement
└── README.md                 # Ce fichier
```

---

## 🚀 Installation

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurer les variables d'environnement
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## ⚙️ Configuration

### Variables d'Environnement Backend

```env
DATABASE_URL="postgresql://user:password@localhost:5432/camg_bopp"
JWT_SECRET="votre_secret_jwt_securise"
PORT=3000
NODE_ENV=development
```

### Variables d'Environnement Frontend

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 📖 Utilisation

### Accès aux Interfaces

| Interface | URL | Rôle requis |
|-----------|-----|-------------|
| Connexion | `/login` | Tous |
| Accueil | `/accueil` | ACCUEIL |
| Test Vue | `/test-vue` | TEST_VUE |
| Médecin | `/medecin` | MEDECIN |
| Administration | `/admin` | ADMIN |
| Écran Public | `/display` | Aucun |

---

## 📊 Modèle de Données Simplifié

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Patient   │────<│   Ticket    │────<│    Queue    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│  TestVision │     │Consultation │
└─────────────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │Prescription │
                   └─────────────┘
```

---

## 🔒 Sécurité

- Authentification JWT avec expiration
- Mots de passe hashés (Bcrypt)
- Contrôle d'accès basé sur les rôles (RBAC)
- Validation des entrées
- Protection CORS
- Sauvegarde automatique quotidienne

---

## 📞 Support

Pour toute question ou assistance technique, contactez l'équipe de développement.

---

## 📜 Licence

Projet propriétaire - Dispensaire Ophtalmologique CAMG-BOPP

---

*Document créé le 09/12/2024 - Version 1.0*
