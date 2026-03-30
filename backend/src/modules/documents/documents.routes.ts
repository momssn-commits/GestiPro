import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth'
import { upload } from '../../middleware/upload'
import {
  getDocuments,
  getDocument,
  uploadDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  advanceWorkflow,
  rejectDocument,
  getStats,
} from './documents.controller'

const router = Router()
router.use(authenticate)

router.get('/',                            getDocuments)
router.get('/stats',                       getStats)
router.get('/:id',                         getDocument)
router.post('/upload',                     upload.single('file'), uploadDocument)
router.patch('/:id',                       updateDocument)
router.delete('/:id',                      deleteDocument)
router.get('/:id/download',                downloadDocument)
router.post('/:id/workflow/advance',       authorize('admin', 'rh', 'manager'), advanceWorkflow)
router.post('/:id/workflow/reject',        authorize('admin', 'rh', 'manager'), rejectDocument)

export default router
