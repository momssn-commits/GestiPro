import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth'
import {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getAttestations,
  createAttestation,
  deleteAttestation,
  downloadAttestation,
  getValidations,
  getMyDemandes,
  createValidationRequest,
  approveValidation,
  rejectValidation,
  deleteValidationRequest,
} from './rh.controller'

const router = Router()
router.use(authenticate)

// Profile
router.get('/profile/me',               getMyProfile)
router.patch('/profile/me',             updateMyProfile)
router.post('/profile/change-password', changePassword)

// Attestations
router.get('/attestations',               getAttestations)
router.post('/attestations',              createAttestation)
router.delete('/attestations/:id',        deleteAttestation)
router.get('/attestations/:id/download',  downloadAttestation)

// Validations
router.get('/validations',              authorize('admin', 'rh', 'manager'), getValidations)
router.get('/mes-demandes',             getMyDemandes)
router.post('/validations',             createValidationRequest)
router.post('/validations/:id/approve', authorize('admin', 'rh', 'manager'), approveValidation)
router.post('/validations/:id/reject',  authorize('admin', 'rh', 'manager'), rejectValidation)
router.delete('/validations/:id',       deleteValidationRequest)

export default router
