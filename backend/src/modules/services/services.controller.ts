import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { query, queryOne } from '../../config/database'
import { AppError } from '../../middleware/errorHandler'
import { v4 as uuidv4 } from 'uuid'

const VALID_COLORS = ['indigo','slate','amber','violet','pink','red','sky','green','orange','teal','blue','purple']

const serviceSchema = z.object({
  name:        z.string().min(2).max(150),
  code:        z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Code: lettres minuscules, chiffres et tirets uniquement'),
  description: z.string().max(500).optional(),
  color:       z.string().optional(),
  chefId:      z.string().uuid().optional().nullable(),
})

const updateServiceSchema = serviceSchema.partial()

// ─── List all services ────────────────────────────────────────────────────────
export async function listServices(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string | undefined

    const rows = await query(
      `SELECT
         s.id, s.name, s.code, s.description, s.color, s.is_active, s.created_at,
         s.chef_id,
         u.first_name AS chef_first_name,
         u.last_name  AS chef_last_name,
         u.job_title  AS chef_job_title,
         COUNT(DISTINCT uu.id)::int AS member_count
       FROM services s
       LEFT JOIN users u  ON u.id = s.chef_id
       LEFT JOIN users uu ON uu.service_id = s.id AND uu.is_active = TRUE
       WHERE s.is_active = TRUE
         ${search ? `AND (s.name ILIKE $1 OR s.description ILIKE $1)` : ''}
       GROUP BY s.id, u.first_name, u.last_name, u.job_title
       ORDER BY s.name`,
      search ? [`%${search}%`] : []
    )
    res.json(rows)
  } catch (err) { next(err) }
}

// ─── Get one service with members ─────────────────────────────────────────────
export async function getService(req: Request, res: Response, next: NextFunction) {
  try {
    const service = await queryOne(
      `SELECT
         s.id, s.name, s.code, s.description, s.color, s.is_active, s.created_at,
         s.chef_id,
         u.first_name AS chef_first_name,
         u.last_name  AS chef_last_name,
         u.job_title  AS chef_job_title
       FROM services s
       LEFT JOIN users u ON u.id = s.chef_id
       WHERE s.id = $1 OR s.code = $1`,
      [req.params.id]
    )
    if (!service) return next(new AppError('Service introuvable', 404))

    const members = await query(
      `SELECT id, first_name, last_name, email, job_title, role, phone, department
       FROM users
       WHERE service_id = $1 AND is_active = TRUE
       ORDER BY last_name, first_name`,
      [(service as { id: string }).id]
    )

    res.json({ ...service, members })
  } catch (err) { next(err) }
}

// ─── Create service (admin/rh) ────────────────────────────────────────────────
export async function createService(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, code, description, color, chefId } = serviceSchema.parse(req.body)

    const existing = await queryOne('SELECT id FROM services WHERE code = $1', [code])
    if (existing) return next(new AppError('Ce code de service existe déjà', 409))

    const validColor = VALID_COLORS.includes(color ?? '') ? color : 'indigo'
    const id = uuidv4()

    const [row] = await query(
      `INSERT INTO services (id, name, code, description, color, chef_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING *`,
      [id, name, code, description ?? null, validColor, chefId ?? null]
    )
    res.status(201).json(row)
  } catch (err) { next(err) }
}

// ─── Update service (admin/rh) ────────────────────────────────────────────────
export async function updateService(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateServiceSchema.parse(req.body)

    const service = await queryOne<{ id: string }>('SELECT id FROM services WHERE id = $1', [req.params.id])
    if (!service) return next(new AppError('Service introuvable', 404))

    const fields: string[] = []
    const params: unknown[] = []

    const map: Record<string, unknown> = {
      name:        data.name,
      code:        data.code,
      description: data.description,
      color:       data.color && VALID_COLORS.includes(data.color) ? data.color : undefined,
      chef_id:     data.chefId,
    }

    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) {
        params.push(val)
        fields.push(`${col} = $${params.length}`)
      }
    }

    if (fields.length === 0) return next(new AppError('Aucun champ à mettre à jour', 400))

    params.push(req.params.id)
    const [updated] = await query(
      `UPDATE services SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    )
    res.json(updated)
  } catch (err) { next(err) }
}

// ─── Delete service (admin only) ─────────────────────────────────────────────
export async function deleteService(req: Request, res: Response, next: NextFunction) {
  try {
    const service = await queryOne<{ id: string; name: string }>(
      'SELECT id, name FROM services WHERE id = $1',
      [req.params.id]
    )
    if (!service) return next(new AppError('Service introuvable', 404))

    // Détacher les membres du service avant suppression
    await query('UPDATE users SET service_id = NULL WHERE service_id = $1', [service.id])
    await query('DELETE FROM services WHERE id = $1', [service.id])

    res.json({ message: `Service "${service.name}" supprimé` })
  } catch (err) { next(err) }
}

// ─── Assign user to service (admin/rh) ───────────────────────────────────────
export async function assignUserToService(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.body)

    const service = await queryOne<{ id: string }>('SELECT id FROM services WHERE id = $1', [req.params.id])
    if (!service) return next(new AppError('Service introuvable', 404))

    const user = await queryOne<{ id: string }>('SELECT id FROM users WHERE id = $1', [userId])
    if (!user) return next(new AppError('Utilisateur introuvable', 404))

    await query('UPDATE users SET service_id = $1, updated_at = NOW() WHERE id = $2', [service.id, userId])
    res.json({ message: 'Utilisateur affecté au service' })
  } catch (err) { next(err) }
}

// ─── Remove user from service (admin/rh) ─────────────────────────────────────
export async function removeUserFromService(req: Request, res: Response, next: NextFunction) {
  try {
    await query(
      'UPDATE users SET service_id = NULL, updated_at = NOW() WHERE id = $1 AND service_id = $2',
      [req.params.userId, req.params.id]
    )
    res.json({ message: 'Utilisateur retiré du service' })
  } catch (err) { next(err) }
}
