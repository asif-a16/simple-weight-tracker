import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/history')
})

test('history page loads', async ({ page }) => {
  await expect(page).toHaveURL(/history/)
})

test('filter pills are visible', async ({ page }) => {
  for (const label of ['All', '7 days', '30 days', '90 days', '1 year', 'Custom']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible()
  }
})

test('All filter is active by default', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'All' })).toHaveClass(/bg-blue-600/)
})

test('clicking a filter activates it', async ({ page }) => {
  const btn = page.getByRole('button', { name: '30 days' })
  await btn.click()
  await expect(btn).toHaveClass(/bg-blue-600/)
})

test('Custom filter shows date range inputs', async ({ page }) => {
  await page.getByRole('button', { name: 'Custom' }).click()
  const inputs = page.locator('input[type="date"]')
  await expect(inputs.first()).toBeVisible()
})

test('history table has correct column headers', async ({ page }) => {
  await expect(page.getByRole('columnheader', { name: 'Date' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Weight' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
})

test('week group headers appear between entries', async ({ page }) => {
  // Week headers are in the table body as colspanned rows
  const weekHeaders = page.locator('tbody td[colspan="3"]')
  const count = await weekHeaders.count()
  // If there are entries, there should be at least one week header
  const rows = page.locator('tbody tr')
  const rowCount = await rows.count()
  if (rowCount > 1) {
    expect(count).toBeGreaterThan(0)
  }
})

test('Edit button opens modal', async ({ page }) => {
  const editBtn = page.getByRole('button', { name: 'Edit' }).first()
  const hasEdit = await editBtn.isVisible().catch(() => false)
  if (!hasEdit) {
    test.skip() // No entries to edit
    return
  }
  await editBtn.click()
  await expect(page.getByRole('heading', { name: 'Edit Entry' })).toBeVisible()
})

test('edit modal has date and weight fields', async ({ page }) => {
  const editBtn = page.getByRole('button', { name: 'Edit' }).first()
  const hasEdit = await editBtn.isVisible().catch(() => false)
  if (!hasEdit) { test.skip(); return }
  await editBtn.click()
  await expect(page.getByLabel('Date')).toBeVisible()
  await expect(page.getByLabel('Weight (kg)')).toBeVisible()
})

test('edit modal closes on cancel', async ({ page }) => {
  const editBtn = page.getByRole('button', { name: 'Edit' }).first()
  const hasEdit = await editBtn.isVisible().catch(() => false)
  if (!hasEdit) { test.skip(); return }
  await editBtn.click()
  await page.getByRole('button', { name: '×' }).click()
  await expect(page.getByRole('heading', { name: 'Edit Entry' })).not.toBeVisible()
})

test('Delete button shows confirmation dialog', async ({ page }) => {
  const deleteBtn = page.getByRole('button', { name: 'Delete' }).first()
  const hasDelete = await deleteBtn.isVisible().catch(() => false)
  if (!hasDelete) { test.skip(); return }
  await deleteBtn.click()
  await expect(page.getByText('Delete entry?')).toBeVisible()
})

test('delete confirmation dialog has cancel and delete buttons', async ({ page }) => {
  const deleteBtn = page.getByRole('button', { name: 'Delete' }).first()
  const hasDelete = await deleteBtn.isVisible().catch(() => false)
  if (!hasDelete) { test.skip(); return }
  await deleteBtn.click()
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Delete$/ })).toBeVisible()
})

test('cancel from delete dialog closes it', async ({ page }) => {
  const deleteBtn = page.getByRole('button', { name: 'Delete' }).first()
  const hasDelete = await deleteBtn.isVisible().catch(() => false)
  if (!hasDelete) { test.skip(); return }
  await deleteBtn.click()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByText('Delete entry?')).not.toBeVisible()
})

test('Export CSV button is visible when entries exist', async ({ page }) => {
  const table = page.locator('table')
  const hasTable = await table.isVisible().catch(() => false)
  if (!hasTable) { test.skip(); return }
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible()
})
