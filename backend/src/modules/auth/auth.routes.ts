import { Router } from 'express'
import { login, getMe, refreshToken } from './auth.controller'
import { authenticate } from '../../middleware/auth'

const router = Router()

router.post('/login',   login)
router.get('/me',       authenticate, getMe)
router.post('/refresh', authenticate, refreshToken)

export default router
