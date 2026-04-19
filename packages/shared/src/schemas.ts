import { z } from 'zod'

const today = () => new Date().toISOString().slice(0, 10)

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password too long'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const weightLogSchema = z.object({
  weight_kg: z
    .number({ invalid_type_error: 'Weight must be a number' })
    .min(1, 'Weight must be at least 1 kg')
    .max(999, 'Weight must be under 999 kg')
    .multipleOf(0.01, 'Weight can have at most 2 decimal places'),
  logged_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((d) => d <= today(), 'Date cannot be in the future'),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .trim()
    .optional()
    .nullable(),
})

export const dateRangeSchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  })
  .refine((d) => d.from <= d.to, { message: 'Start date must be before end date', path: ['from'] })
  .refine((d) => d.to <= today(), { message: 'End date cannot be in the future', path: ['to'] })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type WeightLogInput = z.infer<typeof weightLogSchema>
export type DateRangeInput = z.infer<typeof dateRangeSchema>
