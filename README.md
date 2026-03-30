# GestiPro — Plateforme Intranet RH & Documentaire

Plateforme intranet enterprise avec 3 modules : Espace RH, Gestion documentaire et Centre de formation.

## Stack technique

| Couche       | Technologie                              |
|-------------|------------------------------------------|
| Frontend    | Next.js 14 (App Router), Tailwind CSS, React Query, Zustand |
| Backend     | Node.js / Express, TypeScript            |
| Base de données | PostgreSQL 16                       |
| Stockage fichiers | AWS S3 / MinIO (local dev)        |
| Auth        | JWT (access token)                       |
| Conteneurs  | Docker Compose                           |

## Structure du projet

```
gestipro/
├── frontend/                  # Next.js (App Router)
│   └── src/
│       ├── app/
│       │   ├── (auth)/login/          # Page de connexion
│       │   └── (dashboard)/
│       │       ├── dashboard/         # Tableau de bord général
│       │       ├── rh/
│       │       │   ├── dossier/       # Dossier personnel
│       │       │   ├── attestations/  # Attestations de travail
│       │       │   └── validations/   # Circuit de validation
│       │       ├── documents/
│       │       │   ├── depot/         # Dépôt de fichiers
│       │       │   ├── workflow/      # Kanban workflow 4 étapes
│       │       │   └── tableau-de-bord/
│       │       └── formation/         # Centre de formation
│       ├── components/
│       │   ├── layout/        # Sidebar + Header
│       │   ├── dashboard/
│       │   ├── rh/
│       │   ├── documents/
│       │   └── formation/
│       ├── lib/api/           # Client Axios par module
│       └── store/             # Zustand (auth)
│
├── backend/                   # Express API
│   └── src/
│       ├── config/            # DB, S3, Logger, Env
│       ├── middleware/        # auth JWT, upload multer, errorHandler
│       ├── modules/
│       │   ├── auth/          # Login, /me
│       │   ├── rh/            # Profil, attestations, validations
│       │   ├── documents/     # Upload, workflow 4 étapes
│       │   └── formation/     # Catalogue, inscriptions, progression
│       └── database/
│           └── init.sql       # Schéma + données de test
│
└── docker-compose.yml         # PostgreSQL + MinIO + API + Frontend
```

## Démarrage rapide

### Prérequis
- Docker & Docker Compose
- Node.js 20+

### 1. Cloner et configurer

```bash
# Copier les fichiers d'environnement
cp backend/.env.example backend/.env
```

### 2. Démarrer avec Docker

```bash
docker-compose up -d
```

Les services seront disponibles sur :
- **Frontend** : http://localhost:3000
- **API**      : http://localhost:4000
- **MinIO UI** : http://localhost:9001
- **PostgreSQL**: localhost:5432

### 3. Développement local (sans Docker)

```bash
# Terminal 1 — Backend
cd backend && npm install && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

## Comptes de test

| Rôle     | Email                        | Mot de passe |
|----------|------------------------------|--------------|
| Admin    | admin@gestipro.dz            | Admin@1234   |
| RH       | rh@gestipro.dz               | Admin@1234   |
| Employé  | jean.dupont@gestipro.dz      | Admin@1234   |

## Modules

### 1. Espace RH individuel
- Dossier personnel (informations professionnelles, documents RH)
- Génération automatique d'attestations de travail avec circuit de signature
- Circuit de validation hiérarchique en N étapes

### 2. Gestion documentaire
- Dépôt de fichiers (devis, APD, factures, contrats)
- Workflow kanban en 4 étapes : Dépôt → Vérification → Approbation → Archivage
- Tableau de bord avec statistiques par catégorie et par statut
- Stockage sécurisé S3 avec URLs présignées

### 3. Centre de formation en ligne
- Catalogue de formations avec filtre par niveau / catégorie
- Inscription et suivi de progression par module
- Système de notation et avis

## API Endpoints

```
POST /api/auth/login
GET  /api/auth/me

GET  /api/rh/profile/me
GET  /api/rh/attestations
POST /api/rh/attestations
GET  /api/rh/validations
POST /api/rh/validations/:id/approve
POST /api/rh/validations/:id/reject

GET  /api/documents
POST /api/documents/upload
GET  /api/documents/stats
POST /api/documents/:id/workflow/advance
POST /api/documents/:id/workflow/reject

GET  /api/formation/catalog
GET  /api/formation/my-enrollments
GET  /api/formation/:id
POST /api/formation/:id/enroll
PATCH /api/formation/:id/progress
```

## Variables d'environnement backend

| Variable         | Description                      |
|-----------------|----------------------------------|
| DATABASE_URL    | URL PostgreSQL                   |
| JWT_SECRET      | Secret JWT (min 32 chars)        |
| JWT_EXPIRES_IN  | Durée validité token (ex: `7d`)  |
| S3_ENDPOINT     | URL endpoint S3 / MinIO          |
| S3_ACCESS_KEY   | Clé d'accès S3                   |
| S3_SECRET_KEY   | Clé secrète S3                   |
| S3_BUCKET       | Nom du bucket                    |
| FRONTEND_URL    | URL frontend (CORS)              |
