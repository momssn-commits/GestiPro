import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth'
import {
  listFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderContents,
} from './folders.controller'

const router = Router()
router.use(authenticate)

router.get('/',          listFolders)
router.get('/:id',       getFolderContents)
router.post('/',         authorize('admin', 'rh', 'manager'), createFolder)
router.patch('/:id',     authorize('admin', 'rh', 'manager'), updateFolder)
router.delete('/:id',    authorize('admin', 'rh'),            deleteFolder)

export default router
