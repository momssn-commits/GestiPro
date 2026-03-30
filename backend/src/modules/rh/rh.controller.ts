import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { query, queryOne } from '../../config/database'
import { getPresignedUrl } from '../../config/s3'
import { AppError } from '../../middleware/errorHandler'
import { v4 as uuidv4 } from 'uuid'

// ─── Profile ──────────────────────────────────────────────────────────────────
export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await queryOne(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.department,
              u.phone, u.hire_date, u.job_title, u.grade, u.contract_type
       FROM users u WHERE u.id = $1`,
      [req.user!.userId]
    )
    if (!user) return next(new AppError('Profil introuvable', 404))
    res.json(user)
  } catch (err) { next(err) }
}

// ─── Attestations ─────────────────────────────────────────────────────────────
const createAttestationSchema = z.object({
  type:     z.enum(['travail', 'salaire', 'conge', 'autre']),
  comments: z.string().max(500).optional(),
})

export async function getAttestations(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1)
    const limit = Math.min(50, Number(req.query.limit) || 20)
    const offset = (page - 1) * limit

    const rows = await query(
      `SELECT a.*, u.first_name, u.last_name
       FROM attestations a
       JOIN users u ON u.id = a.user_id
       WHERE a.user_id = $1
       ORDER BY a.requested_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user!.userId, limit, offset]
    )
    const [{ count }] = await query<{ count: string }>(
      'SELECT COUNT(*) FROM attestations WHERE user_id = $1',
      [req.user!.userId]
    )

    res.json({ data: rows, total: Number(count), page, limit, totalPages: Math.ceil(Number(count) / limit) })
  } catch (err) { next(err) }
}

export async function createAttestation(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, comments } = createAttestationSchema.parse(req.body)
    const id = uuidv4()

    const [row] = await query(
      `INSERT INTO attestations (id, user_id, type, comments, status, requested_at, updated_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())
       RETURNING *`,
      [id, req.user!.userId, type, comments]
    )
    res.status(201).json(row)
  } catch (err) { next(err) }
}

export async function downloadAttestation(req: Request, res: Response, next: NextFunction) {
  try {
    const att = await queryOne<{ s3_key: string; status: string; user_id: string }>(
      'SELECT s3_key, status, user_id FROM attestations WHERE id = $1',
      [req.params.id]
    )
    if (!att) return next(new AppError('Attestation introuvable', 404))
    if (att.user_id !== req.user!.userId && req.user!.role === 'employee') {
      return next(new AppError('Accès non autorisé', 403))
    }
    if (!att.s3_key) return next(new AppError('Document non encore disponible', 404))

    const url = await getPresignedUrl(att.s3_key)
    res.json({ url })
  } catch (err) { next(err) }
}

// ─── Validations ─────────────────────────────────────────────────────────────
export async function getValidations(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1)
    const limit = Math.min(50, Number(req.query.limit) || 20)
    const status = req.query.status as string | undefined
    const offset = (page - 1) * limit

    const params: unknown[] = [req.user!.role]
    const conditions = [`v.current_approver_role = $1`]

    if (status) {
      params.push(status)
      conditions.push(`v.status = $${params.length}`)
    }

    params.push(limit, offset)
    const limitIdx  = params.length - 1
    const offsetIdx = params.length

    const rows = await query(
      `SELECT v.*, u.first_name, u.last_name
       FROM validation_requests v
       JOIN users u ON u.id = v.requested_by
       WHERE ${conditions.join(' AND ')}
       ORDER BY v.requested_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )
    res.json({ data: rows, page, limit })
  } catch (err) { next(err) }
}

export async function approveValidation(req: Request, res: Response, next: NextFunction) {
  try {
    const { comments } = z.object({ comments: z.string().optional() }).parse(req.body)
    const vr = await queryOne<{
      id: string; current_step: number; total_steps: number; status: string
    }>(
      'SELECT id, current_step, total_steps, status FROM validation_requests WHERE id = $1',
      [req.params.id]
    )
    if (!vr) return next(new AppError('Demande introuvable', 404))

    const isLastStep = vr.current_step >= vr.total_steps
    const newStatus  = isLastStep ? 'approved' : 'in_review'
    const newStep    = vr.current_step + 1

    await query(
      `UPDATE validation_requests
       SET current_step = $1, status = $2, updated_at = NOW()
       WHERE id = $3`,
      [newStep, newStatus, vr.id]
    )

    await query(
      `INSERT INTO validation_history (id, request_id, action, actor_id, comments, created_at)
       VALUES ($1, $2, 'approved', $3, $4, NOW())`,
      [uuidv4(), vr.id, req.user!.userId, comments]
    )

    res.json({ message: isLastStep ? 'Demande approuvée définitivement' : `Étape ${newStep} validée` })
  } catch (err) { next(err) }
}

export async function rejectValidation(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = z.object({ reason: z.string().min(5) }).parse(req.body)

    await query(
      `UPDATE validation_requests SET status = 'rejected', updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    )
    await query(
      `INSERT INTO validation_history (id, request_id, action, actor_id, comments, created_at)
       VALUES ($1, $2, 'rejected', $3, $4, NOW())`,
      [uuidv4(), req.params.id, req.user!.userId, reason]
    )

    res.json({ message: 'Demande refusée' })
  } catch (err) { next(err) }
}

// ─── Change Password ──────────────────────────────────────────────────────────
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
})

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)

    const user = await queryOne<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.userId]
    )
    if (!user) return next(new AppError('Utilisateur introuvable', 404))

    const valid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!valid) return next(new AppError('Mot de passe actuel incorrect', 400))

    const hash = await bcrypt.hash(newPassword, 10)
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user!.userId])

    res.json({ message: 'Mot de passe modifié avec succès' })
  } catch (err) { next(err) }
}

// ─── Update own profile ───────────────────────────────────────────────────────
const updateProfileSchema = z.object({
  firstName:    z.string().min(2).max(100).optional(),
  lastName:     z.string().min(2).max(100).optional(),
  phone:        z.string().max(30).optional(),
  department:   z.string().max(150).optional(),
})

export async function updateMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateProfileSchema.parse(req.body)

    const fields: string[] = []
    const params: unknown[] = []

    const map: Record<string, unknown> = {
      first_name:  data.firstName,
      last_name:   data.lastName,
      phone:       data.phone,
      department:  data.department,
    }

    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) {
        params.push(val)
        fields.push(`${col} = $${params.length}`)
      }
    }

    if (fields.length === 0) return next(new AppError('Aucun champ à mettre à jour', 400))

    params.push(req.user!.userId)
    const [updated] = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length}
       RETURNING id, email, first_name, last_name, role, department, phone, hire_date, job_title, grade, contract_type`,
      params
    )
    res.json(updated)
  } catch (err) { next(err) }
}

// ─── Delete attestation ───────────────────────────────────────────────────────
export async function deleteAttestation(req: Request, res: Response, next: NextFunction) {
  try {
    const att = await queryOne<{ user_id: string; status: string }>(
      'SELECT user_id, status FROM attestations WHERE id = $1',
      [req.params.id]
    )
    if (!att) return next(new AppError('Attestation introuvable', 404))
    if (att.user_id !== req.user!.userId) return next(new AppError('Accès non autorisé', 403))
    if (att.status !== 'pending') {
      return next(new AppError('Seules les attestations en attente peuvent être supprimées', 400))
    }

    await query('DELETE FROM attestations WHERE id = $1', [req.params.id])
    res.json({ message: 'Attestation supprimée' })
  } catch (err) { next(err) }
}

// ─── Create validation request ────────────────────────────────────────────────
const createValidationSchema = z.object({
  type:    z.string().min(2).max(100),
  subject: z.string().min(5).max(255),
})

export async function createValidationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, subject } = createValidationSchema.parse(req.body)
    const id = uuidv4()

    const [row] = await query(
      `INSERT INTO validation_requests
         (id, type, subject, requested_by, current_step, total_steps,
          current_approver_role, status, requested_at, updated_at)
       VALUES ($1,$2,$3,$4,1,2,'manager','pending',NOW(),NOW())
       RETURNING *`,
      [id, type, subject, req.user!.userId]
    )
    res.status(201).json(row)
  } catch (err) { next(err) }
}

// ─── Get my own submitted validation requests ────────────────────────────────
export async function getMyDemandes(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Math.max(1, Number(req.query.page)  || 1)
    const limit = Math.min(50, Number(req.query.limit) || 20)
    const status = req.query.status as string | undefined
    const offset = (page - 1) * limit

    const params: unknown[] = [req.user!.userId]
    const conditions = [`v.requested_by = $1`]

    if (status) {
      params.push(status)
      conditions.push(`v.status = $${params.length}`)
    }

    params.push(limit, offset)
    const limitIdx  = params.length - 1
    const offsetIdx = params.length

    const rows = await query(
      `SELECT v.*, u.first_name, u.last_name
       FROM validation_requests v
       JOIN users u ON u.id = v.requested_by
       WHERE ${conditions.join(' AND ')}
       ORDER BY v.requested_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    )

    const [{ count }] = await query<{ count: string }>(
      `SELECT COUNT(*) FROM validation_requests WHERE requested_by = $1${status ? ` AND status = $2` : ''}`,
      status ? [req.user!.userId, status] : [req.user!.userId]
    )

    res.json({ data: rows, total: Number(count), page, limit, totalPages: Math.ceil(Number(count) / limit) })
  } catch (err) { next(err) }
}

// ─── Delete validation request ────────────────────────────────────────────────
export async function deleteValidationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const vr = await queryOne<{ requested_by: string; status: string }>(
      'SELECT requested_by, status FROM validation_requests WHERE id = $1',
      [req.params.id]
    )
    if (!vr) return next(new AppError('Demande introuvable', 404))

    const isOwner  = vr.requested_by === req.user!.userId
    const isAdmin  = ['admin', 'rh'].includes(req.user!.role)
    if (!isOwner && !isAdmin) return next(new AppError('Accès non autorisé', 403))
    if (vr.status === 'approved') {
      return next(new AppError('Une demande approuvée ne peut pas être supprimée', 400))
    }

    await query('DELETE FROM validation_history WHERE request_id = $1', [req.params.id])
    await query('DELETE FROM validation_requests WHERE id = $1', [req.params.id])
    res.json({ message: 'Demande supprimée' })
  } catch (err) { next(err) }
}
