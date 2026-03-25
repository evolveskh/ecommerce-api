import { Router, type Request, type Response, type NextFunction } from 'express'
import { CreateOrderSchema } from '../schemas/order.schema.ts'
import { OrderService } from '../services/order.service.ts'
import { authMiddleware } from '../middlewares/auth.middleware.ts'
import { adminMiddleware } from '../middlewares/admin.middleware.ts'
import { AppError } from '../middlewares/error.middleware.ts'
import type { AuthRequest } from '../middlewares/auth.middleware.ts'

const router = Router()

// customer — create order
router.post(
  '/',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = CreateOrderSchema.safeParse(req.body)

      if (!result.success) {
        res.status(400).json({ errors: result.error.flatten().fieldErrors })
        return
      }

      const order = await OrderService.create(req.userId!, result.data)
      res.status(201).json(order)
    } catch (err) {
      next(err)
    }
  },
)

// customer — my orders
router.get(
  '/me',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      res.json(await OrderService.findMyOrders(req.userId!))
    } catch (err) {
      next(err)
    }
  },
)

// customer — my order by id
router.get(
  '/me/:id',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const order = await OrderService.findMyOrderById(
        req.userId!,
        Number(req.params.id),
      )

      if (!order) {
        throw new AppError('order not found', 404)
      }

      res.json(order)
    } catch (err) {
      next(err)
    }
  },
)

// admin — all orders
router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 10
      res.json(await OrderService.findAll({ page, limit }))
    } catch (err) {
      next(err)
    }
  },
)

// admin — update order status
router.put(
  '/:id/status',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body as { status: string }
      const allowed = ['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

      if (!allowed.includes(status)) {
        throw new AppError(`status must be one of: ${allowed.join(', ')}`, 400)
      }

      res.json(await OrderService.updateStatus(Number(req.params.id), status))
    } catch (err) {
      next(err)
    }
  },
)

export default router
