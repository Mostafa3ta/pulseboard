import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { getOrders } from '../data/seed'
import { computeKpis } from '../lib/aggregate'
import { DEFAULT_FILTERS, applyFilters, presetRange, type Filters } from '../lib/filters'
import { formatInteger, formatMoneyCompact } from '../lib/format'
import { CATEGORIES, REGIONS } from '../lib/types'

// Drives the real dashboard in a browser and checks the figures on screen against the same
// pure functions the app uses, so a wrong number fails here even though the data is generated.

const orders = getOrders()
const expectedFor = (filters: Filters) => computeKpis(applyFilters(orders, filters))

const ordersTile = (page: Page) => page.getByRole('article', { name: 'Orders' })
const revenueTile = (page: Page) => page.getByRole('article', { name: 'Revenue' })
const summary = (page: Page) => page.getByRole('status').filter({ hasText: 'Showing' })

/** A day, region and category with no orders at all, found in the dataset rather than assumed. */
function findEmptyFilters(): Filters {
  const byDate = new Map<string, typeof orders>()
  for (const o of orders) byDate.set(o.date, [...(byDate.get(o.date) ?? []), o])
  for (const [date, dayOrders] of byDate) {
    for (const region of REGIONS) {
      for (const category of CATEGORIES) {
        if (!dayOrders.some((o) => o.region === region && o.category === category)) {
          return { from: date, to: date, regions: [region], categories: [category], granularity: null }
        }
      }
    }
  }
  throw new Error('Every day has orders for every region and category; pick a different empty case')
}

test('the default view is the last 90 days, with four KPI tiles and four charts', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Sales & operations' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Last 90 days' })).toHaveAttribute('aria-checked', 'true')

  const expected = expectedFor(DEFAULT_FILTERS)
  await expect(ordersTile(page)).toContainText(formatInteger(expected.orders))
  await expect(revenueTile(page)).toContainText(formatMoneyCompact(expected.revenue))
  await expect(summary(page)).toContainText(`${formatInteger(expected.orders)} orders`)
  await expect(page.getByRole('article', { name: 'Average order' })).toBeVisible()
  await expect(page.getByRole('article', { name: 'Refund rate' })).toBeVisible()
  await expect(page.getByRole('img', { name: /chart|heatmap/i })).toHaveCount(4)
})

test('changing the period changes the figures and the URL', async ({ page }) => {
  await page.goto('/')
  const before = expectedFor(DEFAULT_FILTERS)
  await expect(ordersTile(page)).toContainText(formatInteger(before.orders))

  await page.getByRole('radio', { name: 'Last 7 days' }).click()
  const after = expectedFor({ ...DEFAULT_FILTERS, ...presetRange('7d') })
  expect(after.orders).not.toBe(before.orders)
  await expect(ordersTile(page)).toContainText(formatInteger(after.orders))
  await expect(page).toHaveURL(/from=2026-10-25&to=2026-10-31/)
  await expect(page.getByRole('radio', { name: 'Last 7 days' })).toHaveAttribute('aria-checked', 'true')
})

test('a shared URL reproduces the view exactly', async ({ page }) => {
  await page.goto('/?from=2026-01-01&to=2026-03-31&region=eu&category=home,beauty&g=week')
  const expected = expectedFor({ from: '2026-01-01', to: '2026-03-31', regions: ['eu'], categories: ['home', 'beauty'], granularity: 'week' })
  await expect(ordersTile(page)).toContainText(formatInteger(expected.orders))
  await expect(page.getByRole('button', { name: 'Europe' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'North America' })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('button', { name: 'Home & Living' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('combobox', { name: 'Group by' })).toHaveText('Week')
  await expect(page.getByLabel('From', { exact: true })).toHaveValue('2026-01-01')
  await expect(page.getByLabel('To', { exact: true })).toHaveValue('2026-03-31')
  await expect(summary(page)).toContainText('1 Jan – 31 Mar 2026 · Europe · Home & Living, Beauty')
})

test('a custom range is validated, then applied', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('radio', { name: 'Custom…' }).click()
  await page.getByLabel('From', { exact: true }).fill('2026-06-01')
  await page.getByLabel('To', { exact: true }).fill('2026-05-01')
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'End must be on or after start' })).toBeVisible()
  await expect(page).not.toHaveURL(/from=/)

  await page.getByLabel('To', { exact: true }).fill('2026-06-30')
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page).toHaveURL(/from=2026-06-01&to=2026-06-30/)
  const expected = expectedFor({ ...DEFAULT_FILTERS, from: '2026-06-01', to: '2026-06-30' })
  await expect(ordersTile(page)).toContainText(formatInteger(expected.orders))
})

test('filters that match nothing show an empty state, and clearing it restores the defaults', async ({ page }) => {
  const empty = findEmptyFilters()
  await page.goto(`/?from=${empty.from}&to=${empty.to}&region=${empty.regions[0]}&category=${empty.categories[0]}`)
  await expect(page.getByRole('heading', { name: 'No orders match these filters' })).toBeVisible()
  await expect(summary(page)).toContainText('Showing 0 orders')
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeDisabled()

  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('radio', { name: 'Last 90 days' })).toHaveAttribute('aria-checked', 'true')
  await expect(ordersTile(page)).toContainText(formatInteger(expectedFor(DEFAULT_FILTERS).orders))
})

test('export downloads a CSV named after the range, with one row per filtered order', async ({ page }) => {
  await page.goto('/?from=2026-10-25&to=2026-10-31&region=apac')
  const expected = applyFilters(orders, { ...DEFAULT_FILTERS, from: '2026-10-25', to: '2026-10-31', regions: ['apac'] })

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export CSV' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('pulseboard_2026-10-25_2026-10-31.csv')
  const lines = readFileSync(await file.path(), 'utf8').trim().split('\r\n')
  expect(lines[0]).toBe('id,date,hour,region,category,amount,refunded')
  expect(lines).toHaveLength(expected.length + 1)
  expect(lines[1]).toContain('Asia-Pacific')
  await expect(page.getByText(`Exported ${formatInteger(expected.length)} orders`)).toBeVisible()
})

test('every chart has a table twin', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /table for Revenue share by region/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Revenue share by region' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('row')).toHaveCount(5)
  await expect(dialog.getByRole('cell', { name: 'Europe' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('the theme toggle switches the page and the charts to dark', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('img', { name: /chart|heatmap/i })).toHaveCount(4)
  const lightBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  const darkBackground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(darkBackground).not.toBe(lightBackground)
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
  await expect(page.getByRole('img', { name: /chart|heatmap/i })).toHaveCount(4)
})

test('the page never scrolls sideways', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('img', { name: /chart|heatmap/i })).toHaveCount(4)
  // clientWidth, not innerWidth: emulated mobile Chrome zooms out when a page overflows, which inflates innerWidth.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
