import { describe, it, expect } from 'vitest'
import { weightLogSchema, registerSchema, loginSchema } from '../schemas'

// ---------------------------------------------------------------------------
// weightLogSchema
// ---------------------------------------------------------------------------
describe('weightLogSchema', () => {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  it('accepts valid weight log', () => {
    const result = weightLogSchema.safeParse({ weight_kg: 75.5, logged_at: yesterday })
    expect(result.success).toBe(true)
  })

  it('rejects weight below 1 kg', () => {
    const result = weightLogSchema.safeParse({ weight_kg: 0.5, logged_at: yesterday })
    expect(result.success).toBe(false)
  })

  it('rejects weight of 0', () => {
    const result = weightLogSchema.safeParse({ weight_kg: 0, logged_at: yesterday })
    expect(result.success).toBe(false)
  })

  it('rejects weight above 999 kg', () => {
    const result = weightLogSchema.safeParse({ weight_kg: 999.01, logged_at: yesterday })
    expect(result.success).toBe(false)
  })

  it('rejects weight with more than 2 decimal places', () => {
    const result = weightLogSchema.safeParse({ weight_kg: 75.555, logged_at: yesterday })
    expect(result.success).toBe(false)
  })

  it('accepts weight with exactly 2 decimal places', () => {
    const result = weightLogSchema.safeParse({ weight_kg: 75.55, logged_at: yesterday })
    expect(result.success).toBe(true)
  })

  it('rejects future date', () => {
    const future = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
    const result = weightLogSchema.safeParse({ weight_kg: 75, logged_at: future })
    expect(result.success).toBe(false)
  })

  it('accepts today as date', () => {
    const result = weightLogSchema.safeParse({ weight_kg: 75, logged_at: today })
    expect(result.success).toBe(true)
  })

  it('rejects invalid date format', () => {
    const result = weightLogSchema.safeParse({ weight_kg: 75, logged_at: '21/04/2026' })
    expect(result.success).toBe(false)
  })

  it('accepts null notes', () => {
    const result = weightLogSchema.safeParse({ weight_kg: 75, logged_at: today, notes: null })
    expect(result.success).toBe(true)
  })

  it('rejects notes over 500 characters', () => {
    const result = weightLogSchema.safeParse({
      weight_kg: 75,
      logged_at: today,
      notes: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('accepts notes at exactly 500 characters', () => {
    const result = weightLogSchema.safeParse({
      weight_kg: 75,
      logged_at: today,
      notes: 'a'.repeat(500),
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// registerSchema
// ---------------------------------------------------------------------------
describe('registerSchema', () => {
  const valid = { name: 'Alice', email: 'alice@example.com', password: 'password123' }

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(registerSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
  })

  it('rejects name over 100 characters', () => {
    expect(registerSchema.safeParse({ ...valid, name: 'a'.repeat(101) }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('rejects password shorter than 8 characters', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false)
  })

  it('rejects password over 72 characters', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'a'.repeat(73) }).success).toBe(false)
  })

  it('trims name whitespace', () => {
    const result = registerSchema.safeParse({ ...valid, name: '  Alice  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe('Alice')
  })
})

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe('loginSchema', () => {
  const valid = { email: 'alice@example.com', password: 'anypassword' }

  it('accepts valid login data', () => {
    expect(loginSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ ...valid, email: 'bad' }).success).toBe(false)
  })

  it('rejects empty password', () => {
    expect(loginSchema.safeParse({ ...valid, password: '' }).success).toBe(false)
  })
})
