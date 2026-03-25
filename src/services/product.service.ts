import prisma from '../lib/prisma.ts'
import type {
  CreateProductInput,
  UpdateProductInput,
} from '../schemas/product.schema.ts'

export const ProductService = {
  async create(input: CreateProductInput, imageUrl?: string) {
    return prisma.product.create({
      data: { ...input, imageUrl },
      include: { category: true },
    })
  },

  async findAll(params: {
    page: number
    limit: number
    categoryId?: number
    search?: string
  }) {
    const { page, limit, categoryId, search } = params
    const skip = (page - 1) * limit

    const where = {
      ...(categoryId && { categoryId }),
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ])

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  async findById(id: number) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true },
    })
  },

  async update(id: number, input: UpdateProductInput, imageUrl?: string) {
    return prisma.product.update({
      where: { id },
      data: { ...input, ...(imageUrl && { imageUrl }) },
      include: { category: true },
    })
  },

  async delete(id: number) {
    return prisma.product.delete({ where: { id } })
  },
}
