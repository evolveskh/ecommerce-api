import { Router, type NextFunction, type Request, type Response } from 'express'
import { CategoryService } from '../services/category.service'
import { AppError } from '../middlewares/error.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'
import { adminMiddleware } from '../middlewares/admin.middleware'
import { CreateCategorySchema } from '../schemas/category.schema'

const router = Router()

// public
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await CategoryService.finaAll())
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await CategoryService.findById(Number(req.params.id))

    if (!category) {
      throw new AppError('category not found', 404)
    }

    res.json(category)
  } catch (err) {
    next(err)
  }
})

// admin only
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = CreateCategorySchema.safeParse(req.body)

      if (!result.success) {
        res.status(400).json({ errors: result.error.flatten().fieldErrors })
        return
      }

      res.status(201).json(await CategoryService.create(result.data))
    } catch (err) {
      next(err)
    }
  },
)

router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = CreateCategorySchema.safeParse(req.body)

      if (!result.success) {
        res.status(400).json({ errors: result.error.flatten().fieldErrors })
        return
      }

      res
        .status(200)
        .json(await CategoryService.update(Number(req.params.id), result.data))
    } catch (err) {
      next(err)
    }
  },
)

router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await CategoryService.delete(Number(req.params.id))
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  },
)

export default router
