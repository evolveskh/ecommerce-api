import type { NextFunction, Response } from 'express'
import type { AuthRequest } from './auth.middleware'
import prisma from '../lib/prisma'
import { AppError } from './error.middleware'

export async function adminMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })

    if (!user || user.role !== 'ADMIN') {
      throw new AppError('forbidden', 403)
    }

    next()
  } catch (err) {
    next(err)
  }
}
