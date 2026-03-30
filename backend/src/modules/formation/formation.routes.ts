import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth'
import {
  getCatalog,
  getFormation,
  getMyEnrollments,
  enroll,
  unenroll,
  updateProgress,
  createFormation,
  updateFormation,
  deleteFormation,
  createModule,
  updateModule,
  deleteModule,
} from './formation.controller'

const router = Router()
router.use(authenticate)

// ── Catalog & enrollments (all authenticated users) ──────────────────────────
router.get('/catalog',          getCatalog)
router.get('/my-enrollments',   getMyEnrollments)
router.get('/:id',              getFormation)
router.post('/:id/enroll',      enroll)
router.delete('/:id/enroll',    unenroll)
router.patch('/:id/progress',   updateProgress)

// ── Admin/RH: CRUD formations ─────────────────────────────────────────────────
router.post('/',         authorize('admin', 'rh'), createFormation)
router.patch('/:id',     authorize('admin', 'rh'), updateFormation)
router.delete('/:id',    authorize('admin', 'rh'), deleteFormation)

// ── Admin/RH: CRUD modules ────────────────────────────────────────────────────
router.post('/:id/modules',                   authorize('admin', 'rh'), createModule)
router.patch('/:id/modules/:moduleId',        authorize('admin', 'rh'), updateModule)
router.delete('/:id/modules/:moduleId',       authorize('admin', 'rh'), deleteModule)

export default router
