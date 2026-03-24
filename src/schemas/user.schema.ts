import { z } from 'zod'

export const CreateUserSchema = z.object({
  name: z.string().min(1, 'name is required'),
  email: z.string().email('invalid email'),
  password: z.string().min(6, 'password must be at least 6 characters'),
})

export const LoginSchema = z.object({
  email: z.string().email('invalid email'),
  password: z.string().min(1, 'password is required'),
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type LoginInput = z.infer<typeof LoginSchema>
