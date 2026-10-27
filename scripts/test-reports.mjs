// Run with a Playwright module path: node scripts/test-reports.mjs <path-to-playwright/index.mjs>
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'

const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  const snapshot = (month, cash, value) => ({
    id: `financial:${month}`, month, scheduledDate: `${month}-10`, capturedAt: `${month}-10T00:00:00Z`, updatedAt: `${month}-10T00:00:00Z`,
    data: JSON.stringify({ accounts: [{ id: 'cash', name: 'Cash', currentBalance: cash }], assets: [{ id: 'asset', name: 'Asset', categoryId: 'gold', quantity: 1, unit: 'unit', costBasis: 10000000, currentValue: value }], assetCategories: [{ id: 'gold', name: 'Gold' }] }),
  })
  await page.goto('http://127.0.0.1:5173/#/reports')
  const seed = async (rows) => {
    await page.evaluate((financialSnapshots) => localStorage.setItem('montana:v1', JSON.stringify({ tables: { financialSnapshots } })), rows)
    await page.reload()
    await page.locator('input[type="month"]').fill('2026-10')
  }
  await seed([snapshot('2026-10', -2000000, 15000000), snapshot('2026-09', 1000000, 10000000)])
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.locator('.recharts-wrapper').first().waitFor()
    await page.waitForTimeout(300)
    assert.equal(await page.locator('.recharts-wrapper').count(), 2)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false)
    assert.ok(await page.locator('path[fill="#e11d48"]').count(), 'Negative allocation must stay visible')
    await page.screenshot({ path: `${process.env.TEMP}/montana-reports-${width}.png`, fullPage: true })
  }
  await seed([snapshot('2026-10', 0, 0)])
  assert.equal(await page.getByText('Ch\u01b0a c\u00f3 s\u1ed1 so s\u00e1nh', { exact: true }).count(), 1)
  const broken = { ...snapshot('2026-09', 0, 0), data: '{}' }
  await seed([snapshot('2026-10', 0, 0), broken])
  assert.equal(await page.getByRole('alert').count(), 1)
  assert.equal(await page.locator('.recharts-wrapper').count(), 2, 'Bad previous snapshot must not hide current data')
  await seed([{ ...snapshot('2026-10', 0, 0), data: '{}' }])
  assert.equal(await page.getByRole('alert').count(), 1)
  assert.equal(await page.locator('.recharts-wrapper').count(), 0)
  assert.deepEqual(errors, [])
  console.log('Reports: desktop/mobile, negative/zero values, missing/corrupt snapshots passed')
} finally {
  await browser.close()
}

