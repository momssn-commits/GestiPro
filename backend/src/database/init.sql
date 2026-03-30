-- ============================================================
--  GestiPro — PostgreSQL Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   TEXT         NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  role            VARCHAR(20)  NOT NULL DEFAULT 'employee'
                                CHECK (role IN ('admin','rh','manager','employee')),
  department      VARCHAR(150),
  job_title       VARCHAR(150),
  grade           VARCHAR(50),
  contract_type   VARCHAR(50),
  phone           VARCHAR(30),
  hire_date       DATE,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

-- ─── ATTESTATIONS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attestations (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            VARCHAR(30) NOT NULL CHECK (type IN ('travail','salaire','conge','autre')),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','approved','rejected','signed')),
  comments        TEXT,
  s3_key          TEXT,
  signed_file_url TEXT,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attestations_user ON attestations (user_id);

-- ─── VALIDATION REQUESTS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS validation_requests (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  type                  VARCHAR(50) NOT NULL,
  subject               TEXT        NOT NULL,
  requested_by          UUID        NOT NULL REFERENCES users(id),
  current_step          INT         NOT NULL DEFAULT 1,
  total_steps           INT         NOT NULL DEFAULT 3,
  current_approver_role VARCHAR(20),
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending','in_review','approved','rejected')),
  reference_id          UUID,
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS validation_history (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id  UUID        NOT NULL REFERENCES validation_requests(id) ON DELETE CASCADE,
  action      VARCHAR(20) NOT NULL CHECK (action IN ('approved','rejected','commented')),
  actor_id    UUID        NOT NULL REFERENCES users(id),
  comments    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── DOCUMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(500) NOT NULL,
  category      VARCHAR(30)  NOT NULL CHECK (category IN ('devis','apd','facture','contrat','autre')),
  s3_key        TEXT         NOT NULL,
  file_url      TEXT         NOT NULL,
  file_size     BIGINT       NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  uploaded_by   UUID         NOT NULL REFERENCES users(id),
  workflow_step VARCHAR(20)  NOT NULL DEFAULT 'depot'
                              CHECK (workflow_step IN ('depot','verification','approbation','archivage')),
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','in_review','approved','rejected','archived')),
  comments      TEXT,
  tags          TEXT[],
  uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_uploaded_by   ON documents (uploaded_by);
CREATE INDEX idx_documents_workflow_step ON documents (workflow_step);
CREATE INDEX idx_documents_category      ON documents (category);

CREATE TABLE IF NOT EXISTS document_history (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  action      VARCHAR(30) NOT NULL,
  actor_id    UUID        NOT NULL REFERENCES users(id),
  from_step   VARCHAR(20),
  to_step     VARCHAR(20),
  comments    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── FORMATIONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS formations (
  id              UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  category        VARCHAR(100),
  level           VARCHAR(20)  NOT NULL DEFAULT 'debutant'
                                CHECK (level IN ('debutant','intermediaire','avance')),
  duration        INT          NOT NULL DEFAULT 0,  -- minutes
  instructor      VARCHAR(200),
  cover_url       TEXT,
  is_published    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS formation_modules (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  formation_id  UUID        NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  title         VARCHAR(300) NOT NULL,
  type          VARCHAR(20) NOT NULL CHECK (type IN ('video','pdf','quiz')),
  content_url   TEXT,
  duration      INT         NOT NULL DEFAULT 0,   -- minutes
  order_index   INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  formation_id  UUID        NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  progress_pct  INT         NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (formation_id, user_id)
);

CREATE TABLE IF NOT EXISTS module_progress (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id    UUID        NOT NULL REFERENCES formation_modules(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES users(id)             ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (module_id, user_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  formation_id UUID        NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  rating       SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (formation_id, user_id)
);

-- ─── SERVICES (groupes de travail) ────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(150) NOT NULL UNIQUE,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  description TEXT,
  color       VARCHAR(20)  NOT NULL DEFAULT 'indigo',
  chef_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Lien utilisateur ↔ service (un user peut appartenir à un seul service principal)
ALTER TABLE users ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_service ON users (service_id);

-- ─── DOSSIERS (arborescence de répertoires) ────────────────────
CREATE TABLE IF NOT EXISTS folders (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  parent_id   UUID         REFERENCES folders(id) ON DELETE CASCADE,
  service_id  UUID         REFERENCES services(id) ON DELETE SET NULL,
  created_by  UUID         REFERENCES users(id)    ON DELETE SET NULL,
  is_system   BOOLEAN      NOT NULL DEFAULT FALSE,
  color       VARCHAR(20)  NOT NULL DEFAULT 'indigo',
  icon        VARCHAR(50),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_parent    ON folders (parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_service   ON folders (service_id);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders (created_by);

-- Enrichissement de la table documents : classement par dossier, service et employé (FK existante)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id    UUID REFERENCES folders(id)  ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS service_id   UUID REFERENCES services(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description  TEXT;

CREATE INDEX IF NOT EXISTS idx_documents_folder  ON documents (folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_service ON documents (service_id);

-- ─── SEED DATA ────────────────────────────────────────────────
-- Admin user (password: Admin@1234)
INSERT INTO users (email, password_hash, first_name, last_name, role, department, job_title, hire_date)
VALUES (
  'admin@gestipro.dz',
  '$2a$10$72YQBj/iINy9I7k0S8aLzO9HDIZYgV.5eJvYcM9n4Yb0qyOw80Kua',
  'Admin',
  'GestiPro',
  'admin',
  'Direction Générale',
  'Administrateur système',
  '2020-01-01'
) ON CONFLICT (email) DO NOTHING;


-- Momar Mbaye — Administrateur principal IFS (password: Technique@2026)
INSERT INTO users (email, password_hash, first_name, last_name, role, department, job_title, hire_date)
VALUES (
  'momar.mbaye@ifs.sn',
  '$2a$10$3Qchpv9NgH0cpBBBkUINVOGBHYlKhomB3BkXdRr6Y.ouiGSsAoFOy',
  'Momar',
  'Mbaye',
  'admin',
  'Direction des Systèmes d''Information',
  'Administrateur Plateforme',
  '2026-01-01'
) ON CONFLICT (email) DO NOTHING;

-- Services (groupes de travail)
INSERT INTO services (name, code, description, color) VALUES
  ('Secrétariat Général',  'secretariat-general', 'Coordination administrative et correspondance officielle', 'indigo'),
  ('Technique',            'technique',            'Maintenance, infrastructure et support technique',        'slate'),
  ('Médiathèque',          'mediatheque',          'Gestion des fonds documentaires et multimédia',          'amber'),
  ('Pole Images',          'pole-images',          'Production et gestion des contenus visuels',             'violet'),
  ('Pole Culture',         'pole-culture',         'Animation culturelle et événements',                     'pink'),
  ('Direction',            'direction',            'Direction générale et pilotage stratégique',             'red'),
  ('Communication',        'communication',        'Communication interne et externe',                       'sky'),
  ('Agence Comptable',     'agence-comptable',     'Gestion comptable et financière',                       'green'),
  ('Cours de Langue',      'cours-de-langue',      'Enseignement des langues étrangères',                   'orange'),
  ('Campus France',        'campus-france',        'Orientation et mobilité étudiante',                     'teal')
ON CONFLICT (code) DO NOTHING;

-- Sample formations
INSERT INTO formations (title, description, category, level, duration, instructor, is_published) VALUES
  ('Excel avancé pour professionnels', 'Maîtrisez les fonctions avancées d''Excel', 'Bureautique', 'avance', 480, 'Dr. Amira Khelil', true),
  ('Introduction à la gestion de projet', 'Méthodes et outils de gestion de projet', 'Management', 'intermediaire', 360, 'M. Farid Saadi', true),
  ('Sécurité informatique en entreprise', 'Bonnes pratiques de cybersécurité', 'IT', 'debutant', 240, 'Mme. Rania Bey', true)
ON CONFLICT DO NOTHING;
