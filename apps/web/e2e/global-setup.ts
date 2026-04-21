import { test as setup, expect } from '@playwright/test'
import * as path from 'path'

const authFile = path.join(__dirname, '.auth.json')

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD

  if (!email || !password) {
    throw new Error('E2E_EMAIL and E2E_PASSWORD must be set in apps/web/.env.test.local')
  }

  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })

  await page.context().storageState({ path: authFile })
})
