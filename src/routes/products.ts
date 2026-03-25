import { Router, type Request, type Response, type NextFunction } from 'express'
import {
  CreateProductSchema,
  UpdateProductSchema,
} from '../schemas/product.schema.ts'
import { ProductService } from '../services/product.service.ts'
import { authMiddleware } from '../middlewares/auth.middleware.ts'
import { adminMiddleware } from '../middlewares/admin.middleware.ts'
import { AppError } from '../middlewares/error.middleware.ts'
import { upload } from '../lib/upload.ts'

const router = Router()

// public
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const categoryId = req.query.categoryId
      ? Number(req.query.categoryId)
      : undefined
    const search = req.query.search as string | undefined

    res.json(await ProductService.findAll({ page, limit, categoryId, search }))
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await ProductService.findById(Number(req.params.id))

    if (!product) {
      throw new AppError('product not found', 404)
    }

    res.json(product)
  } catch (err) {
    next(err)
  }
})

// admin only
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = CreateProductSchema.safeParse(req.body)

      if (!result.success) {
        res.status(400).json({ errors: result.error.flatten().fieldErrors })
        return
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined
      res.status(201).json(await ProductService.create(result.data, imageUrl))
    } catch (err) {
      next(err)
    }
  },
)

router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = UpdateProductSchema.safeParse(req.body)

      if (!result.success) {
        res.status(400).json({ errors: result.error.flatten().fieldErrors })
        return
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined
      res.json(
        await ProductService.update(
          Number(req.params.id),
          result.data,
          imageUrl,
        ),
      )
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
      await ProductService.delete(Number(req.params.id))
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  },
)

export default router
