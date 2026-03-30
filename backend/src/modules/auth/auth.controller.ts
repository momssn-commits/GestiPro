import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { query, queryOne } from '../../config/database'
import { env } from '../../config/env'
import { AppError } from '../../middleware/errorHandler'

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
})

function signToken(payload: { userId: string; email: string; role: string }) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions)
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await queryOne<{
      id: string; email: string; password_hash: string;
      first_name: string; last_name: string; role: string; department: string;
    }>(
      'SELECT id, email, password_hash, first_name, last_name, role, department FROM users WHERE email = $1 AND is_active = true',
      [email]
    )

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return next(new AppError('Identifiants incorrects', 401))
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role })

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        department: user.department,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await queryOne<{
      id: string; email: string; first_name: string; last_name: string; role: string; department: string;
    }>(
      'SELECT id, email, first_name, last_name, role, department FROM users WHERE id = $1',
      [req.user!.userId]
    )
    if (!user) return next(new AppError('Utilisateur introuvable', 404))

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      department: user.department,
    })
  } catch (err) {
    next(err)
  }
}

export async function refreshToken(req: Request, res: Response) {
  const token = signToken({
    userId: req.user!.userId,
    email: req.user!.email,
    role: req.user!.role,
  })
  res.json({ token })
}
