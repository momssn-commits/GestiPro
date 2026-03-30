/**
 * dev-with-db.ts
 * Démarre un PostgreSQL embarqué (embedded-postgres) puis lance le serveur Express.
 * Utilisé en développement local quand Docker n'est pas disponible.
 */

import * as fs from 'fs'
import * as path from 'path'
import EmbeddedPostgres from 'embedded-postgres'
import { Client } from 'pg'

const DB_DIR  = path.join(__dirname, '..', '.pg-data')
const DB_NAME = 'gestipro'
const DB_USER = 'gestipro_user'
const DB_PASS = 'gestipro_pass'
const DB_PORT = 5432

/** Charge le fichier .env dans process.env (sans écraser les vars existantes) */
function loadDotEnv() {
  const envFile = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envFile)) {
    console.warn('⚠️  Fichier .env introuvable :', envFile)
    return
  }
  let loaded = 0
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (k && !(k in process.env)) {
      process.env[k] = v
      loaded++
    }
  }
  console.log(`📄  Variables .env chargées (${loaded} entrées)`)
}

async function main() {
  // ── 0. Charger .env AVANT toute validation d'environnement ────────────────
  loadDotEnv()

  // ── 1. Démarrer le serveur postgres embarqué ───────────────────────────────
  console.log('🐘  Démarrage PostgreSQL embarqué…')

  const pg = new EmbeddedPostgres({
    databaseDir: DB_DIR,
    port:        DB_PORT,
    user:        'postgres',       // superuser initial
    password:    'postgres_root',
    persistent:  true,             // conserve les données entre redémarrages
  })

  const isFirstRun = !fs.existsSync(path.join(DB_DIR, 'PG_VERSION'))

  if (isFirstRun) {
    await pg.initialise()
  }
  await pg.start()
  console.log('🐘  PostgreSQL démarré sur le port', DB_PORT)

  // ── 2. Créer la base et l'utilisateur (première fois seulement) ────────────
  if (isFirstRun) {
    console.log('🔧  Initialisation de la base de données…')

    const admin = await pg.getPgClient()
    await admin.connect()

    await admin.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
          CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
        END IF;
      END $$;
    `)

    const dbExists = await admin.query(
      `SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`
    )
    if (dbExists.rows.length === 0) {
      await admin.query(`CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}`)
    }
    await admin.query(`GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER}`)
    await admin.end()

    // Charger le schéma (init.sql)
    console.log('📋  Chargement du schéma SQL…')
    const initSql = fs.readFileSync(
      path.join(__dirname, '..', 'src', 'database', 'init.sql'),
      'utf8'
    )
    const appClient = new Client({
      host: 'localhost', port: DB_PORT,
      database: DB_NAME, user: DB_USER, password: DB_PASS,
    })
    await appClient.connect()
    await appClient.query(initSql)
    await appClient.end()
    console.log('✅  Schéma initialisé avec succès')
  } else {
    console.log('✅  Base de données existante chargée')
  }

  // ── 3. Forcer DATABASE_URL avec les bonnes credentials ────────────────────
  process.env.DATABASE_URL = `postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}`

  // ── 4. Démarrer le serveur Express ────────────────────────────────────────
  console.log('🚀  Démarrage du serveur API…')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../src/index')

  // ── Arrêt propre ────────────────────────────────────────────────────────
  async function shutdown(signal: string) {
    console.log(`\n${signal} reçu — arrêt en cours…`)
    try { await pg.stop() } catch { /* ignore */ }
    process.exit(0)
  }

  process.on('SIGINT',  () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

main().catch(err => {
  console.error('❌  Erreur de démarrage :', err)
  process.exit(1)
})
