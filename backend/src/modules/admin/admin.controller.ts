import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { query, queryOne } from '../../config/database'
import { AppError } from '../../middleware/errorHandler'
import { v4 as uuidv4 } from 'uuid'

const userSchema = z.object({
  email:        z.string().email(),
  password:     z.string().min(8).optional(),
  firstName:    z.string().min(2).max(100),
  lastName:     z.string().min(2).max(100),
  role:         z.enum(['admin', 'rh', 'manager', 'employee']),
  department:   z.string().min(2).max(150).optional(),
  jobTitle:     z.string().min(2).max(150).optional(),
  grade:        z.string().max(50).optional(),
  contractType: z.string().max(50).optional(),
  phone:        z.string().max(30).optional(),
  hireDate:     z.string().optional(),
  serviceId:    z.string().uuid().optional().nullable(),
})

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page   = Math.max(1, Number(req.query.page)  || 1)
    const limit  = Math.min(100, Number(req.query.limit) || 25)
    const offset = (page - 1) * limit
    const search = req.query.search as string | undefined
    const role   = req.query.role   as string | undefined

    const conditions: string[] = []
    const params: unknown[] = []

    if (search) {
      params.push(`%${search}%`)
      conditions.push(
        `(u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`
      )
    }
    if (role) {
      params.push(role)
      conditions.push(`u.role = $${params.length}`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    params.push(limit, offset)

    const rows = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.department, u.job_title,
              u.grade, u.contract_type, u.phone, u.hire_date, u.is_active, u.created_at,
              u.service_id, s.name AS service_name, s.code AS service_code
       FROM users u
       LEFT JOIN services s ON s.id = u.service_id
       ${where}
       ORDER BY u.last_name, u.first_name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    const [{ count }] = await query<{ count: string }>(
      `SELECT COUNT(*) FROM users u LEFT JOIN services s ON s.id = u.service_id ${where}`,
      params.slice(0, -2)
    )

    res.json({ data: rows, total: Number(count), page, limit, totalPages: Math.ceil(Number(count) / limit) })
  } catch (err) { next(err) }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = userSchema.parse(req.body)

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [data.email])
    if (existing) return next(new AppError('Un compte existe déjà avec cet email', 409))

    const plainPassword = data.password || `Temp@${Math.random().toString(36).slice(2, 10)}`
    const passwordHash  = await bcrypt.hash(plainPassword, 10)

    const id = uuidv4()
    const [user] = await query(
      `INSERT INTO users
         (id, email, password_hash, first_name, last_name, role, department,
          job_title, grade, contract_type, phone, hire_date, service_id, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,NOW(),NOW())
       RETURNING id, email, first_name, last_name, role, department, service_id, is_active`,
      [
        id, data.email, passwordHash, data.firstName, data.lastName,
        data.role, data.department, data.jobTitle, data.grade,
        data.contractType, data.phone,
        data.hireDate ? new Date(data.hireDate) : null,
        data.serviceId ?? null,
      ]
    )

    // TODO: send invitation email with tempPassword or reset link

    res.status(201).json(user)
  } catch (err) { next(err) }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const updateSchema = userSchema.partial().omit({ email: true }).extend({
      newPassword: z.string().min(8).optional(),
    })
    const data = updateSchema.parse(req.body)

    const fields: string[] = []
    const params: unknown[] = []

    // Hash and apply new password if provided
    if (data.newPassword) {
      params.push(await bcrypt.hash(data.newPassword, 10))
      fields.push(`password_hash = $${params.length}`)
    }

    const map: Record<string, unknown> = {
      first_name:    data.firstName,
      last_name:     data.lastName,
      role:          data.role,
      department:    data.department,
      job_title:     data.jobTitle,
      grade:         data.grade,
      contract_type: data.contractType,
      phone:         data.phone,
      hire_date:     data.hireDate ? new Date(data.hireDate) : undefined,
      service_id:    data.serviceId !== undefined ? (data.serviceId ?? null) : undefined,
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
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    )
    if (!updated) return next(new AppError('Utilisateur introuvable', 404))

    res.json(updated)
  } catch (err) { next(err) }
}

export async function toggleUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.params.id === req.user!.userId) {
      return next(new AppError('Impossible de désactiver votre propre compte', 400))
    }
    const [user] = await query(
      'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING id, is_active',
      [req.params.id]
    )
    if (!user) return next(new AppError('Utilisateur introuvable', 404))
    res.json(user)
  } catch (err) { next(err) }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.params.id === req.user!.userId) {
      return next(new AppError('Impossible de supprimer votre propre compte', 400))
    }
    const existing = await queryOne<{ role: string }>('SELECT id, role FROM users WHERE id = $1', [req.params.id])
    if (!existing) return next(new AppError('Utilisateur introuvable', 404))
    if (existing.role === 'admin') {
      return next(new AppError('Impossible de supprimer un compte administrateur', 403))
    }

    // Dissociate records before deleting user
    await query('UPDATE documents SET uploaded_by = NULL WHERE uploaded_by = $1', [req.params.id])
    await query('UPDATE attestations SET user_id = NULL WHERE user_id = $1', [req.params.id])
    await query('DELETE FROM enrollments WHERE user_id = $1', [req.params.id])
    await query('DELETE FROM module_progress WHERE user_id = $1', [req.params.id])
    await query('DELETE FROM users WHERE id = $1', [req.params.id])

    res.json({ message: 'Utilisateur supprimé avec succès' })
  } catch (err) { next(err) }
}
