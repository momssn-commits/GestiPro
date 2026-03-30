import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'

// ─── Répertoire local (fallback quand S3/MinIO est indisponible) ─────────────
const LOCAL_UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads')
let useLocalStorage: boolean | null = null // null = pas encore testé

function ensureLocalDir(subDir: string) {
  const dir = path.join(LOCAL_UPLOADS_DIR, subDir)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

// ─── Client S3 ───────────────────────────────────────────────────────────────
export const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
})

/** Teste si S3 est accessible (une seule fois) */
async function isS3Available(): Promise<boolean> {
  if (useLocalStorage !== null) return !useLocalStorage
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }))
    useLocalStorage = false
    console.log('📦 Stockage S3 connecté')
    return true
  } catch {
    useLocalStorage = true
    console.log('📂 S3 indisponible → stockage local dans /uploads/')
    return false
  }
}

// ─── Upload ──────────────────────────────────────────────────────────────────
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'uploads'
): Promise<{ key: string; url: string }> {
  const ext = originalName.split('.').pop()
  const key = `${folder}/${uuidv4()}.${ext}`

  if (await isS3Available()) {
    await s3Client.send(new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      Metadata: { originalName },
    }))
    const url = `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`
    return { key, url }
  }

  // Fallback local
  const dir = ensureLocalDir(folder)
  const filename = `${uuidv4()}.${ext}`
  const filePath = path.join(dir, filename)
  fs.writeFileSync(filePath, buffer)
  const localKey = `${folder}/${filename}`
  const url = `${env.APP_PUBLIC_URL}/uploads/${localKey}`
  return { key: localKey, url }
}

// ─── Presigned URL / URL de téléchargement ───────────────────────────────────
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  if (await isS3Available()) {
    return getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
      { expiresIn }
    )
  }
  // Retourner l'URL locale
  return `${env.APP_PUBLIC_URL}/uploads/${key}`
}

// ─── Suppression ─────────────────────────────────────────────────────────────
export async function deleteFile(key: string): Promise<void> {
  if (await isS3Available()) {
    await s3Client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }))
    return
  }
  // Supprimer le fichier local
  const filePath = path.join(LOCAL_UPLOADS_DIR, key)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
}

// ─── Lecture directe (pour servir le fichier) ────────────────────────────────
export function getLocalFilePath(key: string): string | null {
  const filePath = path.join(LOCAL_UPLOADS_DIR, key)
  return fs.existsSync(filePath) ? filePath : null
}
