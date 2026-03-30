import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { query, queryOne } from '../../config/database'
import { AppError } from '../../middleware/errorHandler'
import { v4 as uuidv4 } from 'uuid'

const folderSchema = z.object({
  name:      z.string().min(1).max(255),
  parentId:  z.string().uuid().optional().nullable(),
  serviceId: z.string().uuid().optional().nullable(),
  color:     z.string().max(20).optional(),
  icon:      z.string().max(50).optional(),
})

// ─── Liste des dossiers (arbre complet) ───────────────────────────────────────
export async function listFolders(req: Request, res: Response, next: NextFunction) {
  try {
    const serviceId = req.query.serviceId as string | undefined

    const params: unknown[] = []
    let where = ''
    if (serviceId) {
      params.push(serviceId)
      where = `WHERE f.service_id = $${params.length} OR f.service_id IS NULL`
    }

    const rows = await query(
      `SELECT
         f.id, f.name, f.parent_id, f.service_id, f.created_by,
         f.is_system, f.color, f.icon, f.created_at,
         s.name AS service_name,
         u.first_name AS creator_first_name, u.last_name AS creator_last_name,
         COUNT(DISTINCT d.id)::int AS document_count
       FROM folders f
       LEFT JOIN services s ON s.id = f.service_id
       LEFT JOIN users    u ON u.id = f.created_by
       LEFT JOIN documents d ON d.folder_id = f.id
       ${where}
       GROUP BY f.id, s.name, u.first_name, u.last_name
       ORDER BY f.is_system DESC, f.name`,
      params
    )
    res.json(rows)
  } catch (err) { next(err) }
}

// ─── Créer un dossier ─────────────────────────────────────────────────────────
export async function createFolder(req: Request, res: Response, next: NextFunction) {
  try {
    const data = folderSchema.parse(req.body)

    // Vérifier l'unicité dans le même parent
    const existing = await queryOne(
      `SELECT id FROM folders
       WHERE name = $1
         AND (parent_id = $2 OR (parent_id IS NULL AND $2 IS NULL))
         AND (service_id = $3 OR (service_id IS NULL AND $3 IS NULL))`,
      [data.name, data.parentId ?? null, data.serviceId ?? null]
    )
    if (existing) return next(new AppError('Un dossier portant ce nom existe déjà ici', 409))

    const id = uuidv4()
    const [folder] = await query(
      `INSERT INTO folders (id, name, parent_id, service_id, created_by, color, icon, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
       RETURNING *`,
      [id, data.name, data.parentId ?? null, data.serviceId ?? null,
       req.user!.userId, data.color ?? 'indigo', data.icon ?? null]
    )
    res.status(201).json(folder)
  } catch (err) { next(err) }
}

// ─── Modifier un dossier ─────────────────────────────────────────────────────
export async function updateFolder(req: Request, res: Response, next: NextFunction) {
  try {
    const data = folderSchema.partial().parse(req.body)

    const folder = await queryOne<{ id: string; is_system: boolean }>(
      'SELECT id, is_system FROM folders WHERE id = $1',
      [req.params.id]
    )
    if (!folder) return next(new AppError('Dossier introuvable', 404))
    if (folder.is_system && req.user!.role !== 'admin') {
      return next(new AppError('Les dossiers système ne peuvent être modifiés que par un administrateur', 403))
    }

    const fields: string[] = []
    const params: unknown[] = []
    const map: Record<string, unknown> = {
      name:       data.name,
      parent_id:  data.parentId,
      service_id: data.serviceId,
      color:      data.color,
      icon:       data.icon,
    }
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { params.push(val); fields.push(`${col} = $${params.length}`) }
    }
    if (fields.length === 0) return next(new AppError('Aucun champ à mettre à jour', 400))

    params.push(req.params.id)
    const [updated] = await query(
      `UPDATE folders SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} RETURNING *`,
      params
    )
    res.json(updated)
  } catch (err) { next(err) }
}

// ─── Supprimer un dossier ────────────────────────────────────────────────────
export async function deleteFolder(req: Request, res: Response, next: NextFunction) {
  try {
    const folder = await queryOne<{ id: string; is_system: boolean }>(
      'SELECT id, is_system FROM folders WHERE id = $1',
      [req.params.id]
    )
    if (!folder) return next(new AppError('Dossier introuvable', 404))
    if (folder.is_system) {
      return next(new AppError('Les dossiers système ne peuvent pas être supprimés', 403))
    }

    // Détacher les documents du dossier avant suppression
    await query('UPDATE documents SET folder_id = NULL WHERE folder_id = $1', [req.params.id])
    await query('DELETE FROM folders WHERE id = $1', [req.params.id])

    res.json({ message: 'Dossier supprimé' })
  } catch (err) { next(err) }
}

// ─── Contenu d'un dossier (sous-dossiers + documents) ───────────────────────
export async function getFolderContents(req: Request, res: Response, next: NextFunction) {
  try {
    const folderId = req.params.id

    const subfolders = await query(
      `SELECT f.*, COUNT(DISTINCT d.id)::int AS document_count
       FROM folders f
       LEFT JOIN documents d ON d.folder_id = f.id
       WHERE f.parent_id = $1
       GROUP BY f.id
       ORDER BY f.name`,
      [folderId]
    )

    const page   = Math.max(1, Number(req.query.page) || 1)
    const limit  = Math.min(100, Number(req.query.limit) || 20)
    const offset = (page - 1) * limit

    const docs = await query(
      `SELECT d.*, u.first_name, u.last_name, s.name AS service_name
       FROM documents d
       JOIN users    u ON u.id = d.uploaded_by
       LEFT JOIN services s ON s.id = d.service_id
       WHERE d.folder_id = $1
       ORDER BY d.uploaded_at DESC
       LIMIT $2 OFFSET $3`,
      [folderId, limit, offset]
    )

    res.json({ subfolders, documents: docs })
  } catch (err) { next(err) }
}
