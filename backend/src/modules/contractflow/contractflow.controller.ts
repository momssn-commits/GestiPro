import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { query, queryOne } from '../../config/database'
import { AppError } from '../../middleware/errorHandler'
import { v4 as uuidv4 } from 'uuid'

// ── Types ─────────────────────────────────────────────────────────────────────
type ActeStatut = 'brouillon' | 'en_instruction' | 'en_validation' | 'signe' | 'archive' | 'rejete'

const TRANSITIONS: Record<ActeStatut, ActeStatut[]> = {
  brouillon:      ['en_instruction', 'rejete'],
  en_instruction: ['en_validation',  'rejete'],
  en_validation:  ['signe',          'rejete'],
  signe:          ['archive'],
  archive:        [],
  rejete:         ['brouillon'],   // permettre la remise en brouillon
}

const ACTE_TYPES = ['convention', 'contrat_prestation', 'accord_cadre', 'protocole', 'avenant'] as const

// ── Helper: enrichir avec alerte ──────────────────────────────────────────────
// Alerte = échéance dans moins de 30 jours ET statut actif
const ALERTE_EXPR = `(
  a.date_fin IS NOT NULL
  AND a.date_fin < NOW() + INTERVAL '30 days'
  AND a.statut NOT IN ('signe','archive','rejete')
) AS alerte`

// ── GET /api/contractflow ─────────────────────────────────────────────────────
export async function getActes(req: Request, res: Response, next: NextFunction) {
  try {
    const page     = Math.max(1, Number(req.query.page)  || 1)
    const limit    = Math.min(100, Number(req.query.limit) || 50)
    const offset   = (page - 1) * limit
    const statut   = req.query.statut   as string | undefined
    const type     = req.query.type     as string | undefined
    const service  = req.query.service  as string | undefined
    const search   = req.query.search   as string | undefined

    const conditions: string[] = []
    const params: unknown[]    = []

    if (statut)  { params.push(statut);          conditions.push(`a.statut = $${params.length}`) }
    if (type)    { params.push(type);             conditions.push(`a.type = $${params.length}`) }
    if (service) { params.push(service);          conditions.push(`a.service = $${params.length}`) }
    if (search)  {
      params.push(`%${search}%`)
      conditions.push(`(a.numero ILIKE $${params.length} OR a.titre ILIKE $${params.length} OR a.partie_b ILIKE $${params.length} OR a.objet ILIKE $${params.length})`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    params.push(limit, offset)

    const rows = await query(
      `SELECT a.*, ${ALERTE_EXPR},
              u.first_name AS initiateur_first_name,
              u.last_name  AS initiateur_last_name
       FROM actes a
       JOIN users u ON u.id = a.initiateur_id
       ${where}
       ORDER BY a.updated_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    const [{ count }] = await query<{ count: string }>(
      `SELECT COUNT(*) FROM actes a ${where}`,
      params.slice(0, -2)
    )

    res.json({
      data: rows,
      total: Number(count),
      page,
      limit,
      totalPages: Math.ceil(Number(count) / limit),
    })
  } catch (err) { next(err) }
}

// ── GET /api/contractflow/stats ───────────────────────────────────────────────
export async function getActeStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const byStatut = await query<{ statut: string; count: string }>(
      'SELECT statut, COUNT(*) AS count FROM actes GROUP BY statut'
    )
    const byType = await query<{ type: string; count: string }>(
      'SELECT type, COUNT(*) AS count FROM actes GROUP BY type'
    )
    const byService = await query<{ service: string; count: string }>(
      'SELECT service, COUNT(*) AS count FROM actes WHERE service IS NOT NULL GROUP BY service ORDER BY count DESC'
    )
    const [{ total_montant }] = await query<{ total_montant: string }>(
      'SELECT COALESCE(SUM(montant), 0) AS total_montant FROM actes'
    )
    const [{ alerte_count }] = await query<{ alerte_count: string }>(
      `SELECT COUNT(*) AS alerte_count FROM actes
       WHERE date_fin IS NOT NULL
         AND date_fin < NOW() + INTERVAL '30 days'
         AND statut NOT IN ('signe','archive','rejete')`
    )

    // Volume mensuel — 6 derniers mois
    const monthly = await query<{ month: string; depot: string; signes: string; rejetes: string }>(
      `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') AS month,
              COUNT(*) FILTER (WHERE TRUE)                 AS depot,
              COUNT(*) FILTER (WHERE statut = 'signe')     AS signes,
              COUNT(*) FILTER (WHERE statut = 'rejete')    AS rejetes
       FROM actes
       WHERE created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at)`
    )

    res.json({
      byStatut,
      byType,
      byService,
      totalMontant: Number(total_montant),
      alerteCount:  Number(alerte_count),
      monthly,
    })
  } catch (err) { next(err) }
}

// ── GET /api/contractflow/:id ─────────────────────────────────────────────────
export async function getActe(req: Request, res: Response, next: NextFunction) {
  try {
    const acte = await queryOne(
      `SELECT a.*, ${ALERTE_EXPR},
              u.first_name AS initiateur_first_name,
              u.last_name  AS initiateur_last_name
       FROM actes a
       JOIN users u ON u.id = a.initiateur_id
       WHERE a.id = $1`,
      [req.params.id]
    )
    if (!acte) return next(new AppError('Acte introuvable', 404))
    res.json(acte)
  } catch (err) { next(err) }
}

// ── POST /api/contractflow ────────────────────────────────────────────────────
export async function createActe(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      titre:        z.string().min(3).max(500),
      type:         z.enum(ACTE_TYPES),
      partieB:      z.string().min(2).max(255),
      objet:        z.string().min(5),
      montant:      z.number().int().nonnegative().optional().nullable(),
      dateDebut:    z.string().optional().nullable(),
      dateFin:      z.string().optional().nullable(),
      service:      z.string().max(150).optional().nullable(),
      observations: z.string().max(2000).optional().nullable(),
    })

    const data = schema.parse(req.body)

    // Auto-numérotation CF-YYYY-NNN
    const year = new Date().getFullYear()
    const [{ count }] = await query<{ count: string }>(
      'SELECT COUNT(*) FROM actes WHERE numero LIKE $1',
      [`CF-${year}-%`]
    )
    const seq    = String(Number(count) + 1).padStart(3, '0')
    const numero = `CF-${year}-${seq}`

    const id = uuidv4()
    const [acte] = await query(
      `INSERT INTO actes
         (id, numero, titre, type, statut, partie_a, partie_b, objet,
          montant, date_debut, date_fin, service, observations, initiateur_id,
          created_at, updated_at)
       VALUES ($1,$2,$3,$4,'brouillon','Institut Français du Sénégal',$5,$6,
               $7,$8,$9,$10,$11,$12,NOW(),NOW())
       RETURNING *`,
      [
        id, numero, data.titre, data.type, data.partieB, data.objet,
        data.montant ?? null, data.dateDebut ?? null, data.dateFin ?? null,
        data.service ?? null, data.observations ?? null, req.user!.userId,
      ]
    )

    // Historique initial
    await query(
      `INSERT INTO acte_history (id, acte_id, action, actor_id, comment, to_statut, created_at)
       VALUES ($1,$2,'depot',$3,'Dépôt initial de l''acte','brouillon',NOW())`,
      [uuidv4(), id, req.user!.userId]
    )

    res.status(201).json(acte)
  } catch (err) { next(err) }
}

// ── PATCH /api/contractflow/:id ───────────────────────────────────────────────
export async function updateActe(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      titre:        z.string().min(3).max(500).optional(),
      partieB:      z.string().min(2).max(255).optional(),
      objet:        z.string().min(5).optional(),
      montant:      z.number().int().nonnegative().optional().nullable(),
      dateDebut:    z.string().optional().nullable(),
      dateFin:      z.string().optional().nullable(),
      service:      z.string().max(150).optional().nullable(),
      observations: z.string().max(2000).optional().nullable(),
    })
    const data = schema.parse(req.body)

    const acte = await queryOne<{ initiateur_id: string; statut: string }>(
      'SELECT initiateur_id, statut FROM actes WHERE id = $1',
      [req.params.id]
    )
    if (!acte) return next(new AppError('Acte introuvable', 404))

    const isOwner      = acte.initiateur_id === req.user!.userId
    const isPrivileged = ['admin', 'rh', 'manager'].includes(req.user!.role)
    if (!isOwner && !isPrivileged) return next(new AppError('Accès non autorisé', 403))
    if (acte.statut !== 'brouillon' && !isPrivileged) {
      return next(new AppError('Seul un acte en brouillon peut être modifié', 400))
    }

    const fields: string[] = []
    const params: unknown[] = []

    const MAP: Record<string, string> = {
      titre: 'titre', partieB: 'partie_b', objet: 'objet',
      montant: 'montant', dateDebut: 'date_debut', dateFin: 'date_fin',
      service: 'service', observations: 'observations',
    }
    for (const [key, col] of Object.entries(MAP)) {
      const val = (data as Record<string, unknown>)[key]
      if (val !== undefined) { params.push(val); fields.push(`${col} = $${params.length}`) }
    }

    if (fields.length === 0) return next(new AppError('Aucun champ à mettre à jour', 400))

    params.push(req.params.id)
    const [updated] = await query(
      `UPDATE actes SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length} RETURNING *`,
      params
    )

    await query(
      `INSERT INTO acte_history (id, acte_id, action, actor_id, comment, created_at)
       VALUES ($1,$2,'update',$3,'Mise à jour des métadonnées',NOW())`,
      [uuidv4(), req.params.id, req.user!.userId]
    )

    res.json(updated)
  } catch (err) { next(err) }
}

// ── POST /api/contractflow/:id/transition ─────────────────────────────────────
export async function transitionActe(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      action:  z.enum(['approve', 'reject', 'complement', 'archive']),
      comment: z.string().max(2000).optional(),
    })
    const { action, comment } = schema.parse(req.body)

    const acte = await queryOne<{ id: string; statut: ActeStatut; initiateur_id: string }>(
      'SELECT id, statut, initiateur_id FROM actes WHERE id = $1',
      [req.params.id]
    )
    if (!acte) return next(new AppError('Acte introuvable', 404))

    const isPrivileged = ['admin', 'rh', 'manager'].includes(req.user!.role)
    if (!isPrivileged) return next(new AppError('Action réservée aux validateurs', 403))

    let newStatut: ActeStatut = acte.statut

    if (action === 'approve') {
      const allowed = TRANSITIONS[acte.statut]
      const next_statut = allowed.find(s => s !== 'rejete')
      if (!next_statut) return next(new AppError('Aucune transition possible depuis ce statut', 400))
      newStatut = next_statut
    } else if (action === 'reject') {
      if (!TRANSITIONS[acte.statut].includes('rejete')) {
        return next(new AppError('Rejet impossible depuis ce statut', 400))
      }
      newStatut = 'rejete'
    } else if (action === 'archive') {
      if (!TRANSITIONS[acte.statut].includes('archive')) {
        return next(new AppError('Archivage impossible depuis ce statut', 400))
      }
      newStatut = 'archive'
    }
    // complement : pas de changement de statut, juste un historique

    if (newStatut !== acte.statut) {
      await query(
        'UPDATE actes SET statut = $1, updated_at = NOW() WHERE id = $2',
        [newStatut, acte.id]
      )
    }

    await query(
      `INSERT INTO acte_history (id, acte_id, action, actor_id, comment, from_statut, to_statut, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
      [uuidv4(), acte.id, action, req.user!.userId, comment ?? null, acte.statut, newStatut]
    )

    res.json({ message: 'Transition effectuée', statut: newStatut })
  } catch (err) { next(err) }
}

// ── GET /api/contractflow/:id/history ─────────────────────────────────────────
export async function getActeHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await query(
      `SELECT h.*, u.first_name, u.last_name, u.role AS actor_role
       FROM acte_history h
       JOIN users u ON u.id = h.actor_id
       WHERE h.acte_id = $1
       ORDER BY h.created_at ASC`,
      [req.params.id]
    )
    res.json(rows)
  } catch (err) { next(err) }
}

// ── GET /api/contractflow/:id/comments ────────────────────────────────────────
export async function getActeComments(req: Request, res: Response, next: NextFunction) {
  try {
    const rows = await query(
      `SELECT c.*, u.first_name, u.last_name, u.role AS author_role
       FROM acte_comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.acte_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.id]
    )
    res.json(rows)
  } catch (err) { next(err) }
}

// ── POST /api/contractflow/:id/comments ───────────────────────────────────────
export async function addActeComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { content } = z.object({ content: z.string().min(1).max(2000) }).parse(req.body)

    const acte = await queryOne('SELECT id FROM actes WHERE id = $1', [req.params.id])
    if (!acte) return next(new AppError('Acte introuvable', 404))

    // Extraire les mentions @prénom.nom
    const mentions = (content.match(/@[\w.]+/g) ?? []).map((m: string) => m.slice(1))

    const [comment] = await query(
      `INSERT INTO acte_comments (id, acte_id, author_id, content, mentions, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW())
       RETURNING *`,
      [uuidv4(), req.params.id, req.user!.userId, content, mentions]
    )

    // Enrichir avec infos auteur
    const full = await queryOne(
      `SELECT c.*, u.first_name, u.last_name, u.role AS author_role
       FROM acte_comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.id = $1`,
      [(comment as { id: string }).id]
    )

    res.status(201).json(full)
  } catch (err) { next(err) }
}
