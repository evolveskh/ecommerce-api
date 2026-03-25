import prisma from '../lib/prisma.ts'
import type { CreateCategoryInput } from '../schemas/category.schema.ts'

export const CategoryService = {
  async create(input: CreateCategoryInput) {
    return prisma.category.create({ data: input })
  },

  async finaAll() {
    return prisma.category.findMany({
      include: { _count: { select: { products: true } } },
    })
  },

  async findById(id: number) {
    return prisma.category.findUnique({
      where: { id },
      include: { products: true },
    })
  },

  async update(id: number, input: CreateCategoryInput) {
    return prisma.category.update({ where: { id }, data: input })
  },

  async delete(id: number) {
    return prisma.category.delete({ where: { id } })
  },
}
