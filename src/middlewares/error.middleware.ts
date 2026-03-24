import type { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // known error - we threw it intentionally
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  // zod validation error bubbled up via next(err)
  if (err instanceof Error) {
    res.status(500).json({ error: err.message })
    return
  }

  // unknown — something really unexpected
  res.status(500).json({ error: 'something went wrong' })
}
