import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../config/logger'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Données invalides',
      details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    })
  }

  logger.error('Unhandled error:', err)
  return res.status(500).json({ error: 'Erreur interne du serveur' })
}
