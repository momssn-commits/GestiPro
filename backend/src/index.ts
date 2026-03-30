import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import path from 'path'

import { env } from './config/env'
import { logger } from './config/logger'
import { errorHandler } from './middleware/errorHandler'

import authRouter       from './modules/auth/auth.routes'
import rhRouter         from './modules/rh/rh.routes'
import documentsRouter  from './modules/documents/documents.routes'
import formationRouter  from './modules/formation/formation.routes'
import adminRouter      from './modules/admin/admin.routes'
import servicesRouter   from './modules/services/services.routes'
import foldersRouter      from './modules/folders/folders.routes'
import onlyofficeRouter  from './modules/onlyoffice/onlyoffice.routes'

const app = express()

// ─── Security / Middleware ───────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}))
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}))

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', limiter)

// ─── Fichiers locaux (fallback quand S3 indisponible) ─────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }))

app.use('/api/auth',      authRouter)
app.use('/api/rh',        rhRouter)
app.use('/api/documents', documentsRouter)
app.use('/api/formation', formationRouter)
app.use('/api/admin',     adminRouter)
app.use('/api/services',  servicesRouter)
app.use('/api/folders',     foldersRouter)
app.use('/api/onlyoffice', onlyofficeRouter)

// ─── Error handler ───────────────────────────────────────────────────────────
app.use(errorHandler)

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  logger.info(`GestiPro API running on port ${env.PORT} [${env.NODE_ENV}]`)
})

export default app
