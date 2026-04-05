import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth'
import {
  getActes,
  getActeStats,
  getActe,
  createActe,
  updateActe,
  transitionActe,
  getActeHistory,
  getActeComments,
  addActeComment,
} from './contractflow.controller'

const router = Router()

// Toutes les routes nécessitent une authentification
router.use(authenticate)

// ── Lecture ──────────────────────────────────────────────────────────────────
router.get('/',           getActes)
router.get('/stats',      getActeStats)
router.get('/:id',        getActe)
router.get('/:id/history', getActeHistory)
router.get('/:id/comments', getActeComments)

// ── Écriture ─────────────────────────────────────────────────────────────────
router.post('/',                         createActe)
router.patch('/:id',                     updateActe)
router.post('/:id/transition',           authorize('admin', 'rh', 'manager'), transitionActe)
router.post('/:id/comments',             addActeComment)

export default router
