import prisma from '../lib/prisma.ts'
import type { CreateOrderInput } from '../schemas/order.schema.ts'
import { AppError } from '../middlewares/error.middleware.ts'
import { EmailService } from './email.service.ts'

export const OrderService = {
  async create(userId: number, input: CreateOrderInput) {
    // fetch all products in one query
    const productIds = input.items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })

    // check all products exist
    if (products.length !== productIds.length) {
      throw new AppError('one or more products not found', 404)
    }

    // check stock for each product
    for (const item of input.items) {
      const product = products.find((p) => p.id === item.productId)!

      if (product.stock < item.quantity) {
        throw new AppError(
          `insufficient stock for product: ${product.name}`,
          400,
        )
      }
    }

    // calculate total
    const total = input.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!
      return sum + product.price * item.quantity
    }, 0)

    // create order + items + decrement stock in one transaction
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          total,
          items: {
            create: input.items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!
              return {
                productId: item.productId,
                quantity: item.quantity,
                priceAtBuy: product.price, // snapshot price
              }
            }),
          },
        },
        include: {
          items: { include: { product: true } },
        },
      })

      // decrement stock for each product
      for (const item of input.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      return order
    }).then(async (order) => {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
      if (user) {
        EmailService.sendOrderConfirmation(user.email, order).catch(() => {
          // non-blocking — email failure must not break the order response
        })
      }
      return order
    })
  },

  async findMyOrders(userId: number) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async findMyOrderById(userId: number, orderId: number) {
    return prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: { include: { product: true } },
      },
    })
  },

  // admin
  async findAll(params: { page: number; limit: number }) {
    const { page, limit } = params
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count(),
    ])

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async updateStatus(orderId: number, status: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
    })
  },
}
