import { Pool } from 'pg'
import { env } from './env'
import { logger } from './logger'

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

db.on('connect', () => logger.debug('New PostgreSQL connection established'))
db.on('error', (err) => logger.error('PostgreSQL pool error:', err))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = Record<string, any>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await db.query<any>(text, params)
  logger.debug(`Query executed in ${Date.now() - start}ms: ${text.slice(0, 80)}`)
  return result.rows
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryOne<T = Record<string, any>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}
