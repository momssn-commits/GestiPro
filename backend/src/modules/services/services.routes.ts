import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth'
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
  assignUserToService,
  removeUserFromService,
} from './services.controller'

const router = Router()
router.use(authenticate)

// Lecture — tous les rôles
router.get('/',         listServices)
router.get('/:id',      getService)

// Écriture — admin / rh uniquement
router.post('/',                              authorize('admin', 'rh'), createService)
router.patch('/:id',                          authorize('admin', 'rh'), updateService)
router.delete('/:id',                         authorize('admin'),       deleteService)
router.post('/:id/members',                   authorize('admin', 'rh'), assignUserToService)
router.delete('/:id/members/:userId',         authorize('admin', 'rh'), removeUserFromService)

export default router
