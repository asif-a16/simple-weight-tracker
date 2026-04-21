import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/settings')
})

test('settings page loads', async ({ page }) => {
  await expect(page).toHaveURL(/settings/)
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
})

test('shows account section with name and email', async ({ page }) => {
  await expect(page.getByText('Name')).toBeVisible()
  await expect(page.getByText('Email')).toBeVisible()
})

test('name edit button shows inline input', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit' }).click()
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
})

test('cancel name edit hides input', async ({ page }) => {
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('button', { name: 'Save' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible()
})

test('shows appearance section with dark mode toggle', async ({ page }) => {
  await expect(page.getByText('Dark mode')).toBeVisible()
})

test('shows data section with export and import', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Import CSV' })).toBeVisible()
})

test('sign out button is present', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
})

test('sign out redirects to login', async ({ page }) => {
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/login/, { timeout: 5000 })
})
