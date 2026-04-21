import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

test.beforeEach(async ({ page }) => {
  await page.goto('/log')
})

test('log weight form renders', async ({ page }) => {
  await expect(page.getByLabel('Date')).toBeVisible()
  await expect(page.getByLabel('Weight (kg)')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Log weight' })).toBeVisible()
})

test('shows validation error for missing weight', async ({ page }) => {
  await page.getByRole('button', { name: 'Log weight' }).click()
  await expect(page.getByText(/weight must be a number/i)).toBeVisible()
})

test('shows validation error for weight below 1 kg', async ({ page }) => {
  await page.getByLabel('Weight (kg)').fill('0.5')
  await page.getByRole('button', { name: 'Log weight' }).click()
  await expect(page.getByText(/at least 1 kg/i)).toBeVisible()
})

test('shows validation error for future date', async ({ page }) => {
  const future = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
  await page.getByLabel('Date').fill(future)
  await page.getByLabel('Weight (kg)').fill('75')
  await page.getByRole('button', { name: 'Log weight' }).click()
  await expect(page.getByText(/cannot be in the future/i)).toBeVisible()
})

test('logs weight successfully and shows toast', async ({ page }) => {
  const testDate = '2020-06-15'

  // Clean up any existing entry for this date first
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    await supabase.from('weight_logs').delete().eq('user_id', user.id).eq('logged_at', testDate)
  }

  await page.getByLabel('Date').fill(testDate)
  await page.getByLabel('Weight (kg)').fill('72.5')
  await page.getByRole('button', { name: 'Log weight' }).click()

  await expect(page.getByText(/weight logged/i)).toBeVisible({ timeout: 5000 })

  // Clean up
  if (user) {
    await supabase.from('weight_logs').delete().eq('user_id', user.id).eq('logged_at', testDate)
  }
})

test('shows duplicate date error', async ({ page }) => {
  const testDate = '2020-07-04'
  const { data: { user } } = await supabase.auth.getUser()

  // Insert an entry first
  if (user) {
    await supabase.from('weight_logs').upsert(
      { user_id: user.id, logged_at: testDate, weight_kg: 75 },
      { onConflict: 'user_id,logged_at' }
    )
  }

  await page.getByLabel('Date').fill(testDate)
  await page.getByLabel('Weight (kg)').fill('76')
  await page.getByRole('button', { name: 'Log weight' }).click()

  await expect(page.getByText(/already have an entry/i)).toBeVisible({ timeout: 5000 })

  // Clean up
  if (user) {
    await supabase.from('weight_logs').delete().eq('user_id', user.id).eq('logged_at', testDate)
  }
})
