import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
})

export const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6),
})

export const itemSchema = z.object({
  name: z.string().min(1),
  rarityId: z.number().int().positive(),
  image: z.string(),
})