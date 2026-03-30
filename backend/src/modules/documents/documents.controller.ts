import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { query, queryOne } from '../../config/database'
import { uploadFile, getPresignedUrl, deleteFile } from '../../config/s3'
import { AppError } from '../../middleware/errorHandler'
import { v4 as uuidv4 } from 'uuid'

const WORKFLOW_STEPS = ['depot', 'verification', 'approbation', 'archivage'] as const
type WorkflowStep = typeof WORKFLOW_STEPS[number]

export async function getDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const page      = Math.max(1, Number(req.query.page)  || 1)
    const limit     = Math.min(100, Number(req.query.limit) || 20)
    const offset    = (page - 1) * limit
    const category  = req.query.category  as string | undefined
    const status    = req.query.status    as string | undefined
    const folderId  = req.query.folderId  as string | undefined
    const serviceId = req.query.serviceId as string | undefined
    const userId    = req.query.userId    as string | undefined
    const search    = req.query.search    as string | undefined

    const conditions: string[] = []
    const params: unknown[] = []

    // Les employés ne voient que leurs propres documents (sauf filtre explicite par admin/rh)
    if (req.user!.role === 'employee') {
      params.push(req.user!.userId)
      conditions.push(`d.uploaded_by = $${params.length}`)
    } else if (userId) {
      params.push(userId)
      conditions.push(`d.uploaded_by = $${params.length}`)
    }
    if (category) {
      params.push(category)
      conditions.push(`d.category = $${params.length}`)
    }
    if (status) {
      params.push(status)
      conditions.push(`d.workflow_step = $${params.length}`)
    }
    if (folderId === 'root') {
      conditions.push(`d.folder_id IS NULL`)
    } else if (folderId) {
      params.push(folderId)
      conditions.push(`d.folder_id = $${params.length}`)
    }
    if (serviceId) {
      params.push(serviceId)
      conditions.push(`d.service_id = $${params.length}`)
    }
    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(d.name ILIKE $${params.length} OR d.description ILIKE $${params.length})`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    params.push(limit, offset)

    const rows = await query(
      `SELECT d.*,
              u.first_name, u.last_name,
              f.name AS folder_name,
              s.name AS service_name, s.color AS service_color
       FROM documents d
       JOIN users    u ON u.id = d.uploaded_by
       LEFT JOIN folders  f ON f.id = d.folder_id
       LEFT JOIN services s ON s.id = d.service_id
       ${where}
       ORDER BY d.uploaded_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )
    const [{ count }] = await query<{ count: string }>(
      `SELECT COUNT(*) FROM documents d
       LEFT JOIN folders  f ON f.id = d.folder_id
       LEFT JOIN services s ON s.id = d.service_id
       ${where}`,
      params.slice(0, -2)
    )

    res.json({ data: rows, total: Number(count), page, limit, totalPages: Math.ceil(Number(count) / limit) })
  } catch (err) { next(err) }
}

export async function getDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await queryOne(
      'SELECT d.*, u.first_name, u.last_name FROM documents d JOIN users u ON u.id = d.uploaded_by WHERE d.id = $1',
      [req.params.id]
    )
    if (!doc) return next(new AppError('Document introuvable', 404))
    res.json(doc)
  } catch (err) { next(err) }
}

export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return next(new AppError('Fichier manquant', 400))

    const bodySchema = z.object({
      category:    z.enum(['devis', 'apd', 'facture', 'contrat', 'autre']),
      folderId:    z.string().uuid().optional().nullable(),
      serviceId:   z.string().uuid().optional().nullable(),
      description: z.string().max(1000).optional(),
    })
    const { category, folderId, serviceId, description } = bodySchema.parse(req.body)

    // S'assurer que le dossier existe si fourni
    if (folderId) {
      const folder = await queryOne('SELECT id FROM folders WHERE id = $1', [folderId])
      if (!folder) return next(new AppError('Dossier introuvable', 404))
    }

    const { key, url } = await uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      `documents/${category}`
    )

    const id = uuidv4()
    const [doc] = await query(
      `INSERT INTO documents
         (id, name, category, s3_key, file_url, file_size, mime_type, uploaded_by,
          folder_id, service_id, description, workflow_step, status, uploaded_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'depot','pending',NOW(),NOW())
       RETURNING *`,
      [id, req.file.originalname, category, key, url, req.file.size, req.file.mimetype,
       req.user!.userId, folderId ?? null, serviceId ?? null, description ?? null]
    )

    res.status(201).json(doc)
  } catch (err) { next(err) }
}

export async function downloadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await queryOne<{ s3_key: string; uploaded_by: string }>(
      'SELECT s3_key, uploaded_by FROM documents WHERE id = $1',
      [req.params.id]
    )
    if (!doc) return next(new AppError('Document introuvable', 404))

    const url = await getPresignedUrl(doc.s3_key)
    res.json({ url })
  } catch (err) { next(err) }
}

export async function advanceWorkflow(req: Request, res: Response, next: NextFunction) {
  try {
    const { comments } = z.object({ comments: z.string().optional() }).parse(req.body)
    const doc = await queryOne<{ id: string; workflow_step: WorkflowStep }>(
      'SELECT id, workflow_step FROM documents WHERE id = $1',
      [req.params.id]
    )
    if (!doc) return next(new AppError('Document introuvable', 404))

    const currentIdx = WORKFLOW_STEPS.indexOf(doc.workflow_step)
    if (currentIdx === -1) return next(new AppError('Étape de workflow invalide', 400))
    if (currentIdx === WORKFLOW_STEPS.length - 1) {
      return next(new AppError('Le document est déjà archivé', 400))
    }

    const nextStep = WORKFLOW_STEPS[currentIdx + 1]
    const newStatus = nextStep === 'archivage' ? 'archived' : 'in_review'

    await query(
      'UPDATE documents SET workflow_step = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [nextStep, newStatus, doc.id]
    )

    await query(
      `INSERT INTO document_history (id, document_id, action, actor_id, from_step, to_step, comments, created_at)
       VALUES ($1,$2,'advanced',$3,$4,$5,$6,NOW())`,
      [uuidv4(), doc.id, req.user!.userId, doc.workflow_step, nextStep, comments]
    )

    res.json({ message: `Document avancé vers "${nextStep}"` })
  } catch (err) { next(err) }
}

export async function rejectDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = z.object({ reason: z.string().min(5) }).parse(req.body)

    await query(
      "UPDATE documents SET status = 'rejected', updated_at = NOW() WHERE id = $1",
      [req.params.id]
    )
    await query(
      `INSERT INTO document_history (id, document_id, action, actor_id, comments, created_at)
       VALUES ($1,$2,'rejected',$3,$4,NOW())`,
      [uuidv4(), req.params.id, req.user!.userId, reason]
    )

    res.json({ message: 'Document refusé' })
  } catch (err) { next(err) }
}

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const byCategory = await query(
      'SELECT category, COUNT(*) as count FROM documents GROUP BY category'
    )
    const byStep = await query(
      'SELECT workflow_step, COUNT(*) as count FROM documents GROUP BY workflow_step'
    )
    res.json({ byCategory, byStep })
  } catch (err) { next(err) }
}

export async function updateDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const updateSchema = z.object({
      name:     z.string().min(1).max(255).optional(),
      category: z.enum(['devis', 'apd', 'facture', 'contrat', 'autre']).optional(),
      comments: z.string().max(1000).optional(),
      tags:     z.array(z.string()).optional(),
    })
    const data = updateSchema.parse(req.body)

    const doc = await queryOne<{ uploaded_by: string; workflow_step: string }>(
      'SELECT uploaded_by, workflow_step FROM documents WHERE id = $1',
      [req.params.id]
    )
    if (!doc) return next(new AppError('Document introuvable', 404))

    // Only owner or admin/rh/manager can update
    const isOwner = doc.uploaded_by === req.user!.userId
    const isPrivileged = ['admin', 'rh', 'manager'].includes(req.user!.role)
    if (!isOwner && !isPrivileged) return next(new AppError('Accès non autorisé', 403))

    // Can only edit metadata when in depot step (unless admin/rh)
    if (doc.workflow_step !== 'depot' && !isPrivileged) {
      return next(new AppError('Le document ne peut plus être modifié après dépôt', 400))
    }

    const fields: string[] = []
    const params: unknown[] = []

    if (data.name     !== undefined) { params.push(data.name);     fields.push(`name = $${params.length}`) }
    if (data.category !== undefined) { params.push(data.category); fields.push(`category = $${params.length}`) }
    if (data.comments !== undefined) { params.push(data.comments); fields.push(`comments = $${params.length}`) }
    if (data.tags     !== undefined) { params.push(data.tags);     fields.push(`tags = $${params.length}`) }

    if (fields.length === 0) return next(new AppError('Aucun champ à mettre à jour', 400))

    params.push(req.params.id)
    const [updated] = await query(
      `UPDATE documents SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} RETURNING *`,
      params
    )
    res.json(updated)
  } catch (err) { next(err) }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await queryOne<{ uploaded_by: string; s3_key: string; workflow_step: string }>(
      'SELECT uploaded_by, s3_key, workflow_step FROM documents WHERE id = $1',
      [req.params.id]
    )
    if (!doc) return next(new AppError('Document introuvable', 404))

    const isOwner      = doc.uploaded_by === req.user!.userId
    const isPrivileged = ['admin', 'rh', 'manager'].includes(req.user!.role)
    if (!isOwner && !isPrivileged) return next(new AppError('Accès non autorisé', 403))

    // Prevent deletion of archived documents unless admin
    if (doc.workflow_step === 'archivage' && req.user!.role !== 'admin') {
      return next(new AppError('Les documents archivés ne peuvent être supprimés que par un administrateur', 403))
    }

    // Delete from S3 then from DB
    try { await deleteFile(doc.s3_key) } catch { /* ignore s3 errors, proceed */ }

    await query('DELETE FROM document_history WHERE document_id = $1', [req.params.id])
    await query('DELETE FROM documents WHERE id = $1', [req.params.id])

    res.json({ message: 'Document supprimé avec succès' })
  } catch (err) { next(err) }
}
