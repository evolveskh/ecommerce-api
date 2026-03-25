import { z } from 'zod'

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'name is required'),
})

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
