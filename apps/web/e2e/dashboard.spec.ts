import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/dashboard')
})

test('dashboard page loads', async ({ page }) => {
  await expect(page).toHaveURL(/dashboard/)
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
})

test('time filter pills are visible', async ({ page }) => {
  for (const label of ['7 days', '30 days', '90 days', '1 year', 'Year', 'Custom']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible()
  }
})

test('clicking a filter pill activates it', async ({ page }) => {
  const btn = page.getByRole('button', { name: '90 days' })
  await btn.click()
  await expect(btn).toHaveClass(/bg-blue-600/)
})

test('Year filter shows year navigation', async ({ page }) => {
  await page.getByRole('button', { name: 'Year' }).click()
  const currentYear = new Date().getFullYear().toString()
  await expect(page.getByText(currentYear)).toBeVisible()
})

test('Custom filter shows date range picker', async ({ page }) => {
  await page.getByRole('button', { name: 'Custom' }).click()
  await expect(page.locator('input[type="date"]').first()).toBeVisible()
})

test('Dots toggle button is visible', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Dots' })).toBeVisible()
})

test('Dots toggle activates on click', async ({ page }) => {
  const btn = page.getByRole('button', { name: 'Dots' })
  await btn.click()
  await expect(btn).toHaveClass(/bg-blue-600/)
})

test('sidebar navigation links are visible', async ({ page }) => {
  for (const label of ['Dashboard', 'Log Weight', 'History', 'Calendar', 'Settings']) {
    await expect(page.getByRole('link', { name: label }).first()).toBeVisible()
  }
})

test('log weight page navigates correctly', async ({ page }) => {
  await page.getByRole('link', { name: 'Log Weight' }).first().click()
  await expect(page).toHaveURL(/log/)
})
