import { z } from 'zod'

export const CreateOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int(),
        quantity: z.number().int().min(1, 'quantity must be at least 1'),
      }),
    )
    .min(1, 'order must have at least one item'),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
