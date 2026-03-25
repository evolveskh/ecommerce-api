import { z } from 'zod'

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('price must be positive'),
  stock: z.coerce.number().int().min(0, 'stock cannot be negative'),
  categoryId: z.coerce.number().int('categoryId must be a number'),
})

export const UpdateProductSchema = CreateProductSchema.partial()

export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
