import multer from 'multer'
import { AppError } from './errorHandler'

const ALLOWED_TYPES = [
  // PDF
  'application/pdf',
  // Images
  'image/png',
  'image/jpeg',
  'image/jpg',
  // Word
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Excel
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // PowerPoint
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // LibreOffice / ODF
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  // Texte
  'text/plain',
  'text/csv',
  'application/rtf',
  'text/rtf',
]

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new AppError(`Type de fichier non autorisé: ${file.mimetype}`, 400))
    }
  },
})
