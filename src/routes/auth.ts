import { Router, type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { CreateUserSchema, LoginSchema } from '../schemas/user.schema'
import { UserService } from '../services/user.service'
import { AppError } from '../middlewares/error.middleware'

const router = Router()

// POST /auth/register
router.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = CreateUserSchema.safeParse(req.body)

      if (!result.success) {
        res.status(400).json({ errors: result.error.flatten().fieldErrors })
        return
      }

      const user = await UserService.create(result.data)
      res.status(201).json(user)
    } catch (err) {
      next(err)
    }
  },
)

// POST /auth/login
router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = LoginSchema.safeParse(req.body)

      if (!result.success) {
        res.status(400).json({ errors: result.error.flatten().fieldErrors })
        return
      }

      const user = await UserService.findByEmail(result.data.email)
      if (!user) {
        throw new AppError('invalid credentials', 401)
      }

      const passwordMatch = await bcrypt.compare(
        result.data?.password,
        user.password,
      )

      if (!passwordMatch) {
        throw new AppError('invalid credentials', 401)
      }

      const secret = process.env.JWT_SECRET
      if (!secret) throw new AppError('JWT_SECRET is not set', 500)

      const token = jwt.sign({ userId: user.id }, secret, {
        expiresIn: '7d',
      })

      res.json({ token })
    } catch (err) {
      next(err)
    }
  },
)

export default router
