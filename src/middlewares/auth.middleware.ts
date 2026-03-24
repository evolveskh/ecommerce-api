import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'
import { AppError } from './error.middleware'

export interface AuthRequest extends Request {
  userId?: number
}

export function authMiddleware(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      throw new AppError('unauthorized', 401)
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number
    }
    req.userId = payload.userId

    next()
  } catch (err) {
    // if we threw AppError ourselves, keep it as is
    if (err instanceof AppError) {
      next(err)
      return
    }
    // jwt.verify failed — bad or expired token
    next(new AppError('invalid token', 401))
  }
}
