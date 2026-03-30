import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { query, queryOne } from '../../config/database'
import { AppError } from '../../middleware/errorHandler'
import { v4 as uuidv4 } from 'uuid'

export async function getCatalog(req: Request, res: Response, next: NextFunction) {
  try {
    const page   = Math.max(1, Number(req.query.page)  || 1)
    const limit  = Math.min(50, Number(req.query.limit) || 12)
    const offset = (page - 1) * limit
    const search   = req.query.search   as string | undefined
    const category = req.query.category as string | undefined
    const level    = req.query.level    as string | undefined

    const conditions: string[] = []
    const params: unknown[] = []

    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(f.title ILIKE $${params.length} OR f.description ILIKE $${params.length})`)
    }
    if (category) { params.push(category); conditions.push(`f.category = $${params.length}`) }
    if (level)    { params.push(level);    conditions.push(`f.level = $${params.length}`) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    params.push(limit, offset)

    const rows = await query(
      `SELECT f.*,
              COUNT(DISTINCT e.user_id) AS enrolled_count,
              COALESCE(AVG(r.rating), 0) AS rating,
              en.user_id IS NOT NULL AS is_enrolled,
              COALESCE(en.progress_pct, 0) AS progress
       FROM formations f
       LEFT JOIN enrollments e  ON e.formation_id = f.id
       LEFT JOIN reviews r      ON r.formation_id = f.id
       LEFT JOIN enrollments en ON en.formation_id = f.id AND en.user_id = $${params.length + 1}
       ${where}
       GROUP BY f.id, en.user_id, en.progress_pct
       ORDER BY f.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      [...params, req.user!.userId]
    )

    const [{ count }] = await query<{ count: string }>(
      `SELECT COUNT(*) FROM formations f ${where}`,
      params.slice(0, -2)
    )

    res.json({ data: rows, total: Number(count), page, limit, totalPages: Math.ceil(Number(count) / limit) })
  } catch (err) { next(err) }
}

export async function getFormation(req: Request, res: Response, next: NextFunction) {
  try {
    const formation = await queryOne(
      `SELECT f.*,
              COUNT(DISTINCT e.user_id) AS enrolled_count,
              COALESCE(AVG(r.rating), 0) AS rating
       FROM formations f
       LEFT JOIN enrollments e ON e.formation_id = f.id
       LEFT JOIN reviews r ON r.formation_id = f.id
       WHERE f.id = $1
       GROUP BY f.id`,
      [req.params.id]
    )
    if (!formation) return next(new AppError('Formation introuvable', 404))

    const modules = await query(
      `SELECT fm.*,
              CASE WHEN mp.module_id IS NOT NULL THEN true ELSE false END AS completed
       FROM formation_modules fm
       LEFT JOIN module_progress mp ON mp.module_id = fm.id AND mp.user_id = $2
       WHERE fm.formation_id = $1
       ORDER BY fm.order_index`,
      [req.params.id, req.user!.userId]
    )

    res.json({ ...formation, modules })
  } catch (err) { next(err) }
}

export async function getMyEnrollments(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await query(
      `SELECT f.*, e.progress_pct AS progress, e.enrolled_at
       FROM enrollments e
       JOIN formations f ON f.id = e.formation_id
       WHERE e.user_id = $1
       ORDER BY e.enrolled_at DESC`,
      [req.user!.userId]
    )
    res.json(rows)
  } catch (err) { next(err) }
}

export async function enroll(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await queryOne(
      'SELECT id FROM enrollments WHERE formation_id = $1 AND user_id = $2',
      [req.params.id, req.user!.userId]
    )
    if (existing) return next(new AppError('Déjà inscrit à cette formation', 409))

    const formation = await queryOne('SELECT id FROM formations WHERE id = $1', [req.params.id])
    if (!formation) return next(new AppError('Formation introuvable', 404))

    await query(
      'INSERT INTO enrollments (id, formation_id, user_id, progress_pct, enrolled_at) VALUES ($1,$2,$3,0,NOW())',
      [uuidv4(), req.params.id, req.user!.userId]
    )
    res.status(201).json({ message: 'Inscription réussie' })
  } catch (err) { next(err) }
}

export async function updateProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { moduleId, completed } = z.object({
      moduleId:  z.string().uuid(),
      completed: z.boolean(),
    }).parse(req.body)

    if (completed) {
      await query(
        `INSERT INTO module_progress (id, module_id, user_id, completed_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (module_id, user_id) DO NOTHING`,
        [uuidv4(), moduleId, req.user!.userId]
      )
    } else {
      await query(
        'DELETE FROM module_progress WHERE module_id = $1 AND user_id = $2',
        [moduleId, req.user!.userId]
      )
    }

    // Recalculate overall progress
    const [{ total }] = await query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM formation_modules WHERE formation_id = (
         SELECT formation_id FROM formation_modules WHERE id = $1
       )`,
      [moduleId]
    )
    const [{ done }] = await query<{ done: string }>(
      `SELECT COUNT(*) AS done FROM module_progress mp
       JOIN formation_modules fm ON fm.id = mp.module_id
       WHERE fm.formation_id = (SELECT formation_id FROM formation_modules WHERE id = $1)
       AND mp.user_id = $2`,
      [moduleId, req.user!.userId]
    )

    const pct = Math.round((Number(done) / Number(total)) * 100)

    await query(
      `UPDATE enrollments SET progress_pct = $1 WHERE formation_id = (
         SELECT formation_id FROM formation_modules WHERE id = $2
       ) AND user_id = $3`,
      [pct, moduleId, req.user!.userId]
    )

    res.json({ progress: pct })
  } catch (err) { next(err) }
}

// ─── Admin: Create formation ──────────────────────────────────────────────────
const formationSchema = z.object({
  title:       z.string().min(3).max(255),
  description: z.string().min(10).max(2000),
  category:    z.string().min(2).max(100),
  level:       z.enum(['debutant', 'intermediaire', 'avance']),
  duration:    z.number().int().positive(),        // minutes
  instructor:  z.string().min(2).max(100),
  coverUrl:    z.string().url().optional(),
  isPublished: z.boolean().optional().default(false),
})

export async function createFormation(req: Request, res: Response, next: NextFunction) {
  try {
    const data = formationSchema.parse(req.body)
    const id   = uuidv4()

    const [row] = await query(
      `INSERT INTO formations
         (id, title, description, category, level, duration, instructor, cover_url, is_published, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
       RETURNING *`,
      [id, data.title, data.description, data.category, data.level, data.duration,
       data.instructor, data.coverUrl ?? null, data.isPublished]
    )
    res.status(201).json(row)
  } catch (err) { next(err) }
}

// ─── Admin: Update formation ──────────────────────────────────────────────────
export async function updateFormation(req: Request, res: Response, next: NextFunction) {
  try {
    const data = formationSchema.partial().parse(req.body)

    const exists = await queryOne('SELECT id FROM formations WHERE id = $1', [req.params.id])
    if (!exists) return next(new AppError('Formation introuvable', 404))

    const fields: string[] = []
    const params: unknown[] = []

    const map: Record<string, unknown> = {
      title:        data.title,
      description:  data.description,
      category:     data.category,
      level:        data.level,
      duration:     data.duration,
      instructor:   data.instructor,
      cover_url:    data.coverUrl,
      is_published: data.isPublished,
    }

    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { params.push(val); fields.push(`${col} = $${params.length}`) }
    }

    if (fields.length === 0) return next(new AppError('Aucun champ à mettre à jour', 400))

    params.push(req.params.id)
    const [updated] = await query(
      `UPDATE formations SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} RETURNING *`,
      params
    )
    res.json(updated)
  } catch (err) { next(err) }
}

// ─── Admin: Delete formation ──────────────────────────────────────────────────
export async function deleteFormation(req: Request, res: Response, next: NextFunction) {
  try {
    const formation = await queryOne('SELECT id FROM formations WHERE id = $1', [req.params.id])
    if (!formation) return next(new AppError('Formation introuvable', 404))

    await query('DELETE FROM reviews WHERE formation_id = $1', [req.params.id])
    await query('DELETE FROM module_progress WHERE module_id IN (SELECT id FROM formation_modules WHERE formation_id = $1)', [req.params.id])
    await query('DELETE FROM formation_modules WHERE formation_id = $1', [req.params.id])
    await query('DELETE FROM enrollments WHERE formation_id = $1', [req.params.id])
    await query('DELETE FROM formations WHERE id = $1', [req.params.id])

    res.json({ message: 'Formation supprimée avec succès' })
  } catch (err) { next(err) }
}

// ─── Admin: Add module to formation ──────────────────────────────────────────
const moduleSchema = z.object({
  title:      z.string().min(2).max(255),
  type:       z.enum(['video', 'pdf', 'quiz']),
  contentUrl: z.string().url().optional(),
  duration:   z.number().int().positive(),  // minutes
  orderIndex: z.number().int().min(0).optional(),
})

export async function createModule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = moduleSchema.parse(req.body)

    const formation = await queryOne('SELECT id FROM formations WHERE id = $1', [req.params.id])
    if (!formation) return next(new AppError('Formation introuvable', 404))

    // Auto-set order_index if not provided
    let orderIndex = data.orderIndex
    if (orderIndex === undefined) {
      const [{ max }] = await query<{ max: number | null }>(
        'SELECT MAX(order_index) AS max FROM formation_modules WHERE formation_id = $1',
        [req.params.id]
      )
      orderIndex = (max ?? -1) + 1
    }

    const id = uuidv4()
    const [row] = await query(
      `INSERT INTO formation_modules
         (id, formation_id, title, type, content_url, duration, order_index, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       RETURNING *`,
      [id, req.params.id, data.title, data.type, data.contentUrl ?? null, data.duration, orderIndex]
    )
    res.status(201).json(row)
  } catch (err) { next(err) }
}

// ─── Admin: Update module ─────────────────────────────────────────────────────
export async function updateModule(req: Request, res: Response, next: NextFunction) {
  try {
    const data = moduleSchema.partial().parse(req.body)

    const mod = await queryOne(
      'SELECT id FROM formation_modules WHERE id = $1 AND formation_id = $2',
      [req.params.moduleId, req.params.id]
    )
    if (!mod) return next(new AppError('Module introuvable', 404))

    const fields: string[] = []
    const params: unknown[] = []

    const map: Record<string, unknown> = {
      title:       data.title,
      type:        data.type,
      content_url: data.contentUrl,
      duration:    data.duration,
      order_index: data.orderIndex,
    }

    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { params.push(val); fields.push(`${col} = $${params.length}`) }
    }

    if (fields.length === 0) return next(new AppError('Aucun champ à mettre à jour', 400))

    params.push(req.params.moduleId)
    const [updated] = await query(
      `UPDATE formation_modules SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    )
    res.json(updated)
  } catch (err) { next(err) }
}

// ─── Admin: Delete module ─────────────────────────────────────────────────────
export async function deleteModule(req: Request, res: Response, next: NextFunction) {
  try {
    const mod = await queryOne(
      'SELECT id FROM formation_modules WHERE id = $1 AND formation_id = $2',
      [req.params.moduleId, req.params.id]
    )
    if (!mod) return next(new AppError('Module introuvable', 404))

    await query('DELETE FROM module_progress WHERE module_id = $1', [req.params.moduleId])
    await query('DELETE FROM formation_modules WHERE id = $1', [req.params.moduleId])

    // Recalculate progress for all enrolled users
    await query(
      `UPDATE enrollments e
       SET progress_pct = COALESCE((
         SELECT ROUND(COUNT(mp.id)::numeric / NULLIF(COUNT(fm.id),0) * 100)
         FROM formation_modules fm
         LEFT JOIN module_progress mp ON mp.module_id = fm.id AND mp.user_id = e.user_id
         WHERE fm.formation_id = e.formation_id
       ), 0)
       WHERE e.formation_id = $1`,
      [req.params.id]
    )

    res.json({ message: 'Module supprimé avec succès' })
  } catch (err) { next(err) }
}

// ─── User: Unenroll from formation ───────────────────────────────────────────
export async function unenroll(req: Request, res: Response, next: NextFunction) {
  try {
    const enrollment = await queryOne(
      'SELECT id FROM enrollments WHERE formation_id = $1 AND user_id = $2',
      [req.params.id, req.user!.userId]
    )
    if (!enrollment) return next(new AppError('Inscription introuvable', 404))

    await query(
      `DELETE FROM module_progress WHERE user_id = $1
       AND module_id IN (SELECT id FROM formation_modules WHERE formation_id = $2)`,
      [req.user!.userId, req.params.id]
    )
    await query(
      'DELETE FROM enrollments WHERE formation_id = $1 AND user_id = $2',
      [req.params.id, req.user!.userId]
    )

    res.json({ message: 'Désinscription effectuée avec succès' })
  } catch (err) { next(err) }
}
