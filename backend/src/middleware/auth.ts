import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { AppError } from './errorHandler'

export interface JwtPayload {
  userId: string
  email: string
  role: 'admin' | 'rh' | 'manager' | 'employee'
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('Token manquant', 401))
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    next(new AppError('Token invalide ou expiré', 401))
  }
}

export function authorize(...roles: JwtPayload['role'][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('Non authentifié', 401))
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Accès non autorisé', 403))
    }
    next()
  }
}
