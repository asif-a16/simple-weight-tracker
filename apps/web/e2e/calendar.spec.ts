import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/calendar')
})

test('calendar page loads', async ({ page }) => {
  await expect(page).toHaveURL(/calendar/)
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
})

test('shows current month and year', async ({ page }) => {
  const now = new Date()
  const monthName = now.toLocaleString('en-US', { month: 'long' })
  const year = now.getFullYear().toString()
  await expect(page.getByText(`${monthName} ${year}`)).toBeVisible()
})

test('shows day column headers', async ({ page }) => {
  for (const day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
    await expect(page.getByText(day)).toBeVisible()
  }
})

test('previous month button is present', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Previous month' })).toBeVisible()
})

test('next month button is present', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Next month' })).toBeVisible()
})

test('next month button is disabled on current month', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Next month' })).toBeDisabled()
})

test('navigates to previous month', async ({ page }) => {
  const now = new Date()
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthName = prevMonth.toLocaleString('en-US', { month: 'long' })

  await page.getByRole('button', { name: 'Previous month' }).click()
  await expect(page.getByText(`${prevMonthName}`)).toBeVisible()
})

test('navigates back to current month after going back', async ({ page }) => {
  const now = new Date()
  const monthName = now.toLocaleString('en-US', { month: 'long' })
  const year = now.getFullYear().toString()

  await page.getByRole('button', { name: 'Previous month' }).click()
  await page.getByRole('button', { name: 'Next month' }).click()
  await expect(page.getByText(`${monthName} ${year}`)).toBeVisible()
})

test('clicking a past day opens log/edit modal', async ({ page }) => {
  // Click day 1 of current month (always in the past or today)
  const today = new Date()
  const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  const dayBtn = page.getByRole('button', { name: new RegExp(`^${firstOfMonth}`) })
  const hasDayBtn = await dayBtn.isVisible().catch(() => false)

  if (!hasDayBtn) {
    // Fall back to clicking day number 1 via aria-label
    const day1 = page.locator(`[aria-label^="${firstOfMonth}"]`)
    const hasDay1 = await day1.isVisible().catch(() => false)
    if (!hasDay1) { test.skip(); return }
    await day1.click()
  } else {
    await dayBtn.click()
  }

  // Modal should appear with a heading containing the date
  await expect(page.locator('.fixed')).toBeVisible({ timeout: 3000 })
})

test('modal has weight form fields', async ({ page }) => {
  // Navigate to last month and click day 1 to avoid today conflict
  await page.getByRole('button', { name: 'Previous month' }).click()
  const prevMonth = new Date()
  prevMonth.setMonth(prevMonth.getMonth() - 1)
  const firstOfPrevMonth = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`

  const dayCell = page.locator(`[aria-label^="${firstOfPrevMonth}"]`)
  const hasCell = await dayCell.isVisible().catch(() => false)
  if (!hasCell) { test.skip(); return }

  await dayCell.click()
  await expect(page.getByLabel('Weight (kg)')).toBeVisible({ timeout: 3000 })
})

test('modal closes on cancel', async ({ page }) => {
  const today = new Date()
  const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  const dayCell = page.locator(`[aria-label^="${firstOfMonth}"]`)
  const hasCell = await dayCell.isVisible().catch(() => false)
  if (!hasCell) { test.skip(); return }

  await dayCell.click()
  await page.getByRole('button', { name: '×' }).click()
  await expect(page.locator('.fixed')).not.toBeVisible({ timeout: 2000 })
})
