# 📅 Planning Détaillé du Projet CAMG-BOPP

## Vue d'Ensemble des Phases

| Phase | Nom | Durée | Statut |
|-------|-----|-------|--------|
| 1 | Fondations | 2 semaines | 🔵 À faire |
| 2 | Accueil & Tickets | 2 semaines | 🔵 À faire |
| 3 | File d'Attente | 2 semaines | 🔵 À faire |
| 4 | Test de Vue | 2 semaines | 🔵 À faire |
| 5 | Consultation | 2 semaines | 🔵 À faire |
| 6 | Administration | 2 semaines | 🔵 À faire |
| 7 | Déploiement | 2 semaines | 🔵 À faire |

**Durée totale estimée : 14 semaines**

---

## 🔵 PHASE 1 : Fondations

### Semaine 1 - Backend

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Initialisation projet Node.js/Express/TS | Haute | 2h | ⬜ |
| Configuration ESLint/Prettier | Moyenne | 1h | ⬜ |
| Configuration Prisma | Haute | 2h | ⬜ |
| Schéma base de données initial | Haute | 4h | ⬜ |
| Modèle User avec rôles | Haute | 2h | ⬜ |
| Service d'authentification JWT | Haute | 4h | ⬜ |
| Middleware d'authentification | Haute | 2h | ⬜ |
| Middleware de gestion des rôles | Haute | 2h | ⬜ |
| Routes auth (login/logout/me) | Haute | 3h | ⬜ |
| Tests unitaires auth | Moyenne | 3h | ⬜ |

### Semaine 2 - Frontend

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Initialisation Vite/React/TS | Haute | 1h | ⬜ |
| Configuration TailwindCSS | Haute | 1h | ⬜ |
| Structure des dossiers | Moyenne | 1h | ⬜ |
| Composants UI de base (Button, Input, Card) | Haute | 4h | ⬜ |
| Layout principal | Haute | 3h | ⬜ |
| Page de connexion | Haute | 4h | ⬜ |
| Service API (axios) | Haute | 2h | ⬜ |
| Context d'authentification | Haute | 3h | ⬜ |
| Protection des routes | Haute | 2h | ⬜ |
| Navigation par rôle | Haute | 2h | ⬜ |

### Critères de Validation Phase 1
- [ ] Un utilisateur peut se connecter
- [ ] Les routes sont protégées par rôle
- [ ] La base de données est opérationnelle
- [ ] Le frontend communique avec le backend

---

## 🟢 PHASE 2 : Module Accueil & Tickets

### Semaine 3 - Backend Patients & Tickets

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Modèle Patient (Prisma) | Haute | 2h | ⬜ |
| Modèle Ticket (Prisma) | Haute | 2h | ⬜ |
| CRUD Patients | Haute | 4h | ⬜ |
| Recherche patients | Haute | 2h | ⬜ |
| Génération numéro de passage | Haute | 3h | ⬜ |
| Génération QR Code | Moyenne | 2h | ⬜ |
| API Tickets | Haute | 3h | ⬜ |
| Validation des données | Haute | 2h | ⬜ |

### Semaine 4 - Frontend Accueil

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Page d'accueil agent | Haute | 4h | ⬜ |
| Formulaire enregistrement patient | Haute | 4h | ⬜ |
| Recherche patient existant | Haute | 3h | ⬜ |
| Affichage ticket généré | Haute | 2h | ⬜ |
| Composant QR Code | Moyenne | 2h | ⬜ |
| Impression ticket | Basse | 3h | ⬜ |
| Liste des tickets du jour | Haute | 2h | ⬜ |
| Gestion rendez-vous (base) | Moyenne | 4h | ⬜ |

### Critères de Validation Phase 2
- [ ] Enregistrement d'un nouveau patient
- [ ] Génération d'un ticket avec numéro unique
- [ ] Recherche de patients existants
- [ ] Affichage QR Code

---

## 🟡 PHASE 3 : File d'Attente Intelligente

### Semaine 5 - Backend File d'Attente

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Modèle Queue (Prisma) | Haute | 2h | ⬜ |
| Algorithme de priorité | Haute | 6h | ⬜ |
| Service file d'attente | Haute | 4h | ⬜ |
| API Queue | Haute | 3h | ⬜ |
| Configuration WebSocket | Haute | 4h | ⬜ |
| Événements temps réel | Haute | 3h | ⬜ |
| Calcul temps d'attente | Moyenne | 2h | ⬜ |

### Semaine 6 - Frontend File d'Attente

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Écran d'affichage public | Haute | 6h | ⬜ |
| Animation appel numéro | Moyenne | 2h | ⬜ |
| Système sonore | Moyenne | 2h | ⬜ |
| Interface gestion file (agent) | Haute | 4h | ⬜ |
| Bouton "Appeler suivant" | Haute | 2h | ⬜ |
| Affichage priorités | Haute | 2h | ⬜ |
| Connexion WebSocket | Haute | 3h | ⬜ |
| Tests temps réel | Moyenne | 2h | ⬜ |

### Critères de Validation Phase 3
- [ ] Les priorités sont respectées automatiquement
- [ ] L'écran public affiche le numéro en cours
- [ ] Les mises à jour sont en temps réel
- [ ] Le son fonctionne lors de l'appel

---

## 🟠 PHASE 4 : Module Test de Vue

### Semaine 7 - Backend Tests Visuels

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Modèle TestVision (Prisma) | Haute | 2h | ⬜ |
| CRUD Tests visuels | Haute | 3h | ⬜ |
| Liaison Patient-Test | Haute | 2h | ⬜ |
| Historique tests patient | Haute | 2h | ⬜ |
| Workflow ticket → test | Haute | 3h | ⬜ |
| Validation données médicales | Haute | 2h | ⬜ |

### Semaine 8 - Frontend Tests Visuels

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Interface technicien test | Haute | 4h | ⬜ |
| Formulaire saisie OD/OG | Haute | 4h | ⬜ |
| Affichage patient en cours | Haute | 2h | ⬜ |
| Historique tests | Haute | 3h | ⬜ |
| Validation et transfert | Haute | 2h | ⬜ |
| Liste patients en attente | Haute | 2h | ⬜ |

### Critères de Validation Phase 4
- [ ] Saisie des résultats OD/OG
- [ ] Liaison automatique au dossier patient
- [ ] Historique consultable
- [ ] Transfert vers consultation

---

## 🔴 PHASE 5 : Module Consultation Médicale

### Semaine 9 - Backend Consultations

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Modèle Consultation (Prisma) | Haute | 2h | ⬜ |
| Modèle Prescription (Prisma) | Haute | 2h | ⬜ |
| CRUD Consultations | Haute | 3h | ⬜ |
| CRUD Prescriptions | Haute | 3h | ⬜ |
| Historique médical complet | Haute | 3h | ⬜ |
| Génération PDF ordonnance | Haute | 4h | ⬜ |
| Liaison salle lunettes | Moyenne | 2h | ⬜ |

### Semaine 10 - Frontend Médecin

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Interface médecin | Haute | 4h | ⬜ |
| Vue dossier patient complet | Haute | 4h | ⬜ |
| Formulaire consultation | Haute | 4h | ⬜ |
| Formulaire ordonnance | Haute | 3h | ⬜ |
| Aperçu/Impression ordonnance | Haute | 3h | ⬜ |
| Liste patients en attente | Haute | 2h | ⬜ |

### Critères de Validation Phase 5
- [ ] Accès complet au dossier patient
- [ ] Saisie diagnostic
- [ ] Génération ordonnance PDF
- [ ] Impression fonctionnelle

---

## 🟣 PHASE 6 : Administration & Statistiques

### Semaine 11 - Backend Administration

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| API Statistiques | Haute | 4h | ⬜ |
| Calculs agrégés | Haute | 4h | ⬜ |
| CRUD Utilisateurs | Haute | 3h | ⬜ |
| Export Excel | Haute | 3h | ⬜ |
| Export PDF | Haute | 3h | ⬜ |
| Système d'archivage | Moyenne | 3h | ⬜ |

### Semaine 12 - Frontend Administration

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Tableau de bord | Haute | 6h | ⬜ |
| Graphiques statistiques | Haute | 4h | ⬜ |
| Gestion utilisateurs | Haute | 4h | ⬜ |
| Interface exports | Haute | 2h | ⬜ |
| Paramètres système | Moyenne | 2h | ⬜ |
| Logs d'activité | Basse | 2h | ⬜ |

### Critères de Validation Phase 6
- [ ] Tableau de bord fonctionnel
- [ ] Statistiques exactes
- [ ] Exports Excel/PDF
- [ ] Gestion utilisateurs complète

---

## ⚫ PHASE 7 : Tests, Déploiement & Formation

### Semaine 13 - Tests & Corrections

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Tests unitaires backend | Haute | 8h | ⬜ |
| Tests intégration API | Haute | 6h | ⬜ |
| Tests E2E frontend | Haute | 6h | ⬜ |
| Tests utilisateurs | Haute | 8h | ⬜ |
| Correction bugs | Haute | 8h | ⬜ |
| Optimisation performances | Moyenne | 4h | ⬜ |

### Semaine 14 - Déploiement & Formation

| Tâche | Priorité | Estimation | Statut |
|-------|----------|------------|--------|
| Configuration serveur | Haute | 4h | ⬜ |
| Déploiement base de données | Haute | 2h | ⬜ |
| Déploiement application | Haute | 4h | ⬜ |
| Configuration sauvegardes | Haute | 2h | ⬜ |
| Documentation utilisateur | Haute | 6h | ⬜ |
| Formation personnel | Haute | 8h | ⬜ |
| Support post-déploiement | Haute | 8h | ⬜ |

### Critères de Validation Phase 7
- [ ] Tous les tests passent
- [ ] Application déployée et accessible
- [ ] Sauvegardes automatiques configurées
- [ ] Personnel formé
- [ ] Documentation complète

---

## 📊 Résumé des Estimations

| Phase | Heures Backend | Heures Frontend | Total |
|-------|----------------|-----------------|-------|
| Phase 1 | 25h | 23h | 48h |
| Phase 2 | 20h | 24h | 44h |
| Phase 3 | 24h | 23h | 47h |
| Phase 4 | 14h | 17h | 31h |
| Phase 5 | 19h | 20h | 39h |
| Phase 6 | 20h | 20h | 40h |
| Phase 7 | 40h | - | 40h |
| **Total** | **162h** | **127h** | **289h** |

---

## 🎯 Jalons Clés

| Date | Jalon | Livrable |
|------|-------|----------|
| Fin S2 | MVP Auth | Système de connexion |
| Fin S4 | MVP Accueil | Enregistrement + Tickets |
| Fin S6 | MVP File | File d'attente temps réel |
| Fin S8 | MVP Clinique | Tests + Consultations |
| Fin S12 | Version Complète | Toutes fonctionnalités |
| Fin S14 | Production | Déploiement final |

---

## 📝 Notes de Suivi

### Risques Identifiés
1. **Connexion réseau instable** → Prévoir mode hors-ligne
2. **Résistance au changement** → Formation approfondie
3. **Matériel insuffisant** → Audit équipement préalable

### Dépendances Externes
- Écran d'affichage public (TV/moniteur)
- Imprimante tickets
- Serveur local ou hébergement

---

*Dernière mise à jour : 09/12/2024*
