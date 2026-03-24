import type { CreateUserInput } from '../schemas/user.schema'
import prisma from '../lib/prisma.ts'
import bcrypt from 'bcryptjs'

export const UserService = {
  async create(input: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(input.password, 10)

    return prisma.user.create({
      data: { ...input, password: hashedPassword },
      select: { id: true, name: true, email: true, createdAt: true }, // never return password
    })
  },

  async findAll() {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
    })
  },

  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true },
    })
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } }) // includes password for auth check
  },
}
