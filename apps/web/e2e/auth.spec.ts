import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test('redirects unauthenticated user from dashboard to login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/login/)
})

test('redirects unauthenticated user from history to login', async ({ page }) => {
  await page.goto('/history')
  await expect(page).toHaveURL(/login/)
})

test('shows error for invalid credentials', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill('nobody@fake.invalid')
  await page.locator('#password').fill('wrongpassword')
  await page.locator('button[type="submit"]').click()
  await expect(page.getByText('Invalid email or password')).toBeVisible()
})

test('shows validation error for invalid email format', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill('not-an-email')
  await page.locator('#password').fill('password123')
  await page.locator('button[type="submit"]').click()
  await expect(page.getByText(/invalid email/i)).toBeVisible()
})

test('shows validation error for empty password', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill('test@example.com')
  await page.locator('button[type="submit"]').click()
  await expect(page.getByText(/password is required/i)).toBeVisible()
})

test('authenticated user on login page is redirected to dashboard', async ({ page }) => {
  // Uses stored auth state from setup
  test.use({ storageState: 'e2e/.auth.json' })
  await page.goto('/login')
  // Should be redirected away since already authenticated
  await expect(page).not.toHaveURL(/login/)
})
