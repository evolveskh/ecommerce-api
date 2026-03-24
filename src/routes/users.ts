import { Router, type NextFunction, type Request, type Response } from 'express'
import { CreateUserSchema } from '../schemas/user.schema'
import { UserService } from '../services/user.service'
import { AppError } from '../middlewares/error.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
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
})

// protected routes below

router.get(
  '/',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await UserService.findAll())
    } catch (err) {
      next(err)
    }
  },
)

router.get(
  '/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.findById(Number(req.params.id))

      if (!user) {
        throw new AppError('user not found', 404) // ← throw instead of manual res
      }

      res.json(user)
    } catch (err) {
      next(err)
    }
  },
)

export default router
