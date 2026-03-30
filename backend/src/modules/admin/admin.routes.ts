import { Router } from 'express'
import { authenticate, authorize } from '../../middleware/auth'
import {
  listUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from './admin.controller'

const router = Router()
router.use(authenticate, authorize('admin'))

router.get('/users',               listUsers)
router.post('/users',              createUser)
router.patch('/users/:id',         updateUser)
router.patch('/users/:id/toggle',  toggleUserStatus)
router.delete('/users/:id',        deleteUser)

export default router
