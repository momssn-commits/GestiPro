import { db } from '../config/database'
import { logger } from '../config/logger'

/**
 * Migrations incrémentales — idempotentes (IF NOT EXISTS).
 * S'exécutent automatiquement au démarrage du backend.
 */
const MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: 'contractflow_tables',
    sql: `
      CREATE TABLE IF NOT EXISTS actes (
        id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        numero       VARCHAR(50)  NOT NULL UNIQUE,
        titre        VARCHAR(500) NOT NULL,
        type         VARCHAR(30)  NOT NULL
                                   CHECK (type IN ('convention','contrat_prestation','accord_cadre','protocole','avenant')),
        statut       VARCHAR(30)  NOT NULL DEFAULT 'brouillon'
                                   CHECK (statut IN ('brouillon','en_instruction','en_validation','signe','archive','rejete')),
        partie_a     VARCHAR(255) NOT NULL DEFAULT 'Institut Français du Sénégal',
        partie_b     VARCHAR(255) NOT NULL,
        objet        TEXT         NOT NULL,
        montant      BIGINT,
        date_debut   DATE,
        date_fin     DATE,
        service      VARCHAR(150),
        observations TEXT,
        initiateur_id UUID        NOT NULL REFERENCES users(id),
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_actes_statut     ON actes (statut);
      CREATE INDEX IF NOT EXISTS idx_actes_type       ON actes (type);
      CREATE INDEX IF NOT EXISTS idx_actes_initiateur ON actes (initiateur_id);
      CREATE INDEX IF NOT EXISTS idx_actes_numero     ON actes (numero);

      CREATE TABLE IF NOT EXISTS acte_history (
        id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
        acte_id     UUID        NOT NULL REFERENCES actes(id) ON DELETE CASCADE,
        action      VARCHAR(20) NOT NULL
                                 CHECK (action IN ('depot','approve','reject','complement','archive','update')),
        actor_id    UUID        NOT NULL REFERENCES users(id),
        comment     TEXT,
        from_statut VARCHAR(30),
        to_statut   VARCHAR(30),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_acte_history_acte ON acte_history (acte_id);

      CREATE TABLE IF NOT EXISTS acte_comments (
        id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
        acte_id    UUID        NOT NULL REFERENCES actes(id) ON DELETE CASCADE,
        author_id  UUID        NOT NULL REFERENCES users(id),
        content    TEXT        NOT NULL,
        mentions   TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_acte_comments_acte ON acte_comments (acte_id);
    `,
  },
]

export async function runMigrations(): Promise<void> {
  // Table de suivi des migrations
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       VARCHAR(100) PRIMARY KEY,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `)

  for (const migration of MIGRATIONS) {
    const { rows } = await db.query(
      'SELECT name FROM _migrations WHERE name = $1',
      [migration.name]
    )
    if (rows.length > 0) {
      logger.debug(`Migration "${migration.name}" déjà appliquée, ignorée.`)
      continue
    }

    try {
      await db.query(migration.sql)
      await db.query('INSERT INTO _migrations (name) VALUES ($1)', [migration.name])
      logger.info(`✅ Migration "${migration.name}" appliquée avec succès.`)
    } catch (err) {
      logger.error(`❌ Échec de la migration "${migration.name}":`, err)
      throw err
    }
  }
}
