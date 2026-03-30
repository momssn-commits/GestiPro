import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { query, queryOne } from '../../config/database'
import { uploadFile, getPresignedUrl } from '../../config/s3'
import { env } from '../../config/env'
import { AppError } from '../../middleware/errorHandler'
import { v4 as uuidv4 } from 'uuid'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Déduit le type OnlyOffice (word / cell / slide / pdf) depuis le mime ou l'extension */
function getDocType(mimeType: string, filename: string): { docType: string; fileType: string } {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''

  const wordExts   = ['doc', 'docx', 'odt', 'rtf', 'txt']
  const cellExts   = ['xls', 'xlsx', 'ods', 'csv']
  const slideExts  = ['ppt', 'pptx', 'odp']

  if (wordExts.includes(ext))  return { docType: 'word',  fileType: ext }
  if (cellExts.includes(ext))  return { docType: 'cell',  fileType: ext }
  if (slideExts.includes(ext)) return { docType: 'slide', fileType: ext }
  if (ext === 'pdf')           return { docType: 'pdf',   fileType: 'pdf' }

  // Fallback sur le mime type
  if (mimeType.includes('word') || mimeType.includes('text'))  return { docType: 'word',  fileType: 'docx' }
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return { docType: 'cell',  fileType: 'xlsx' }
  if (mimeType.includes('presentation'))                        return { docType: 'slide', fileType: 'pptx' }
  if (mimeType.includes('pdf'))                                 return { docType: 'pdf',   fileType: 'pdf' }

  return { docType: 'word', fileType: 'docx' }
}

/** Signe la config OnlyOffice avec le secret JWT */
function signConfig(config: object): string {
  return jwt.sign(config, env.ONLYOFFICE_JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '4h',
  })
}

// ─── GET /api/onlyoffice/editor-config/:id ────────────────────────────────────
export async function getEditorConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await queryOne<{
      id: string; name: string; s3_key: string; file_url: string
      mime_type: string; uploaded_by: string; status: string
    }>(
      'SELECT id, name, s3_key, file_url, mime_type, uploaded_by, status FROM documents WHERE id = $1',
      [req.params.id]
    )
    if (!doc) return next(new AppError('Document introuvable', 404))

    // Générer une URL présignée (1h) pour que OnlyOffice puisse télécharger le fichier
    const downloadUrl = await getPresignedUrl(doc.s3_key, 3600)

    const { docType, fileType } = getDocType(doc.mime_type, doc.name)

    // Clé unique pour invalider le cache OnlyOffice à chaque session d'édition
    const docKey = `${doc.id}-${Date.now()}`

    // URL de callback (OnlyOffice appelera cette URL lors de la sauvegarde)
    const callbackUrl = `${env.APP_PUBLIC_URL}/api/onlyoffice/callback?docId=${doc.id}&secret=${env.ONLYOFFICE_JWT_SECRET.slice(0, 8)}`

    const user = req.user!
    const isReadOnly = doc.status === 'approved' || doc.status === 'archived'

    const config = {
      document: {
        fileType,
        key:   docKey,
        title: doc.name,
        url:   downloadUrl,
        permissions: {
          comment:  !isReadOnly,
          edit:     !isReadOnly,
          download: true,
          print:    true,
          review:   !isReadOnly,
        },
      },
      documentType: docType,
      editorConfig: {
        callbackUrl,
        lang: 'fr',
        mode: isReadOnly ? 'view' : 'edit',
        user: {
          id:   user.userId,
          name: user.email,
        },
        customization: {
          autosave:    true,
          forcesave:   false,
          logo:        { image: '', url: '' },
          hideRightMenu: false,
          chat:        false,
          comments:    true,
        },
      },
    }

    const token = signConfig(config)

    res.json({
      documentServerUrl: env.ONLYOFFICE_DOC_SERVER,
      config: { ...config, token },
    })
  } catch (err) { next(err) }
}

// ─── POST /api/onlyoffice/callback ───────────────────────────────────────────
/**
 * OnlyOffice appelle cette URL quand un document est sauvegardé.
 * status 2 = prêt à sauvegarder, 6 = forceSave
 * Voir : https://api.onlyoffice.com/editors/callback
 */
export async function onlyofficeCallback(req: Request, res: Response) {
  const { docId } = req.query as { docId: string }
  const body = req.body as {
    status: number
    url?: string
    key?: string
    users?: string[]
    changesurl?: string
  }

  // OnlyOffice s'attend toujours à { error: 0 } en réponse
  if (!docId) return res.json({ error: 0 })

  try {
    // status 2 ou 6 = document modifié, url disponible pour téléchargement
    if ((body.status === 2 || body.status === 6) && body.url) {

      // Télécharger le fichier depuis OnlyOffice
      const fileBuffer = await downloadFromUrl(body.url)

      // Récupérer les infos du document
      const doc = await queryOne<{ name: string; mime_type: string; s3_key: string }>(
        'SELECT name, mime_type, s3_key FROM documents WHERE id = $1',
        [docId]
      )
      if (!doc) return res.json({ error: 1 })

      // Re-uploader sur S3 (écrase la version précédente)
      const { key, url } = await uploadFile(
        fileBuffer,
        doc.name,
        doc.mime_type,
        doc.s3_key.split('/').slice(0, -1).join('/') // conserver le même chemin
      )

      // Mettre à jour la BD
      await query(
        `UPDATE documents SET s3_key = $1, file_url = $2, updated_at = NOW() WHERE id = $3`,
        [key, url, docId]
      )

      console.log(`[OnlyOffice] Document ${docId} sauvegardé (status ${body.status})`)
    }
  } catch (err) {
    console.error('[OnlyOffice] Callback error:', err)
    return res.json({ error: 1 })
  }

  res.json({ error: 0 })
}

// ─── Helper : télécharger un fichier depuis une URL ──────────────────────────
function downloadFromUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (resp) => {
      const chunks: Buffer[] = []
      resp.on('data', (chunk) => chunks.push(chunk))
      resp.on('end',  () => resolve(Buffer.concat(chunks)))
      resp.on('error', reject)
    }).on('error', reject)
  })
}
