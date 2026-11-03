// Run with the dev server on port 5173 and a Playwright module path.
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(pathToFileURL(process.argv[2]).href)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
const page = await browser.newPage()
await page.goto('http://127.0.0.1:5173/')
const results = await page.evaluate(async () => {
  const source = await (await fetch('/src/lib/tags.ts')).text()
  const storePath = source.match(/from ["']([^"']*\/store\.ts[^"']*)["']/)?.[1] ?? '/src/lib/store.ts'
  const store = await import(storePath)
  const tags = await import('/src/lib/tags.ts')
  const check = (condition, message) => { if (!condition) throw new Error(message) }
  check(tags.normalizeTagName(' ##CÀPHÊ ') === 'càphê' && tags.validTagName('càphê') && !tags.validTagName('bad name'), 'normalization')
  const local = tags.saveTag('Càphê')
  const draft = { date: '2026-11-03', type: 'expense', amount: 1, categoryId: '', accountId: '', toAccountId: '', note: '', tagIds: [local.id] }
  const tx = store.upsert('transactions', draft)
  let rejected = false
  try { store.upsert('transactions', { ...draft, tagIds: ['unknown'] }) } catch { rejected = true }
  check(rejected, 'upsert validates references')
  const more = ['one', 'two', 'three'].map((name) => tags.saveTag(name).id)
  rejected = false
  try { store.upsert('transactions', { ...draft, tagIds: [local.id, ...more] }) } catch { rejected = true }
  check(rejected, 'upsert rejects four tags')
  rejected = false
  try { store.importTables({ transactions: [{ ...tx, tagIds: ['unknown'], updatedAt: '2099' }] }) } catch { rejected = true }
  check(rejected && store.getState().tables.transactions.find((row) => row.id === tx.id).tagIds[0] === local.id, 'atomic invalid import')
  // Legacy JSON omits the property entirely.
  const legacy = { ...tx, updatedAt: '2100' }; delete legacy.tagIds
  store.importTables({ transactions: [legacy] })
  check(store.getState().tables.transactions.find((row) => row.id === tx.id).tagIds[0] === local.id, 'legacy import preserves tags')
  store.updateSettings({ apiUrl: 'https://example.invalid', autoSync: false })
  window.fetch = async () => ({ ok: true, json: async () => ({ ok: true, serverTime: '2100', data: { transactions: [] } }) })
  await store.sync()
  check(store.getState().sync.status === 'error' && store.getState().tables.transactions.find((row) => row.id === tx.id).tagIds[0] === local.id, 'old backend rejected without losing tags')
  const remote = { ...local, id: 'remote-id' }
  const data = structuredClone(store.getState().tables)
  data.tags = [remote]
  data.transactions = []
  const calls = []
  window.fetch = async (_url, options) => {
    const req = JSON.parse(options.body); calls.push(req)
    if (req.action === 'push') throw new Error('offline')
    return { ok: true, json: async () => ({ ok: true, serverTime: '2100', data }) }
  }
  store.updateSettings({ apiUrl: 'https://example.invalid', autoSync: false })
  await store.sync()
  check(store.getState().tables.tags.some((tag) => tag.id === remote.id), 'remote winner retained on failure')
  check(store.getState().tables.transactions.find((row) => row.id === tx.id).tagIds[0] === remote.id, 'references reconciled on failure')
  check(calls.some((call) => call.action === 'push'), 'push attempted')
  return 'tag validation, legacy import and failed-sync reconciliation passed'
})
console.log(results)
await page.evaluate(() => {
  const state = JSON.parse(localStorage.getItem('montana:v1'))
  const now = new Date()
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const stamp = now.toISOString()
  state.tables.tags = [...'abcdefghij'].map((name) => ({ id: name, name, archived: false, updatedAt: stamp }))
  state.tables.tags.push({ id: 'archived', name: 'archived', archived: true, updatedAt: stamp }, { id: 'deleted', name: 'deleted', deleted: true, updatedAt: stamp })
  const tx = (id, tagIds, deleted = false) => ({ id, date, type: 'expense', amount: 1, categoryId: 'cat-food', accountId: '', toAccountId: '', note: id, tagIds, updatedAt: stamp, deleted })
  state.tables.accounts.push({ id: 'bank', name: 'Bank', kind: 'bank', openingBalance: 0, currentBalance: 0, color: '#000000', icon: '', archived: false, updatedAt: stamp })
  state.tables.transactions = [tx('match', ['a', 'b']), tx('match-two', ['b']), tx('extra', ['b']), { ...tx('other', ['a']), accountId: 'bank' }, tx('deleted', ['i'], true), ...['income', 'transfer', 'adjustment', 'investment'].map((type) => ({ ...tx(type, ['a', 'b']), type, amount: 100 })), { ...tx('old', ['a', 'b']), date: '2000-01-01', amount: 100 }]
  state.settings = { ...state.settings, apiUrl: '', autoSync: false }
  localStorage.setItem('montana:v1', JSON.stringify(state))
})
await page.goto('http://127.0.0.1:5173/#/transactions')
await page.reload()
for (const width of [390, 1280]) {
  await page.setViewportSize({ width, height: 900 })
  const buttons = page.getByLabel('Thẻ phổ biến').getByRole('button')
  assert.equal(await buttons.count(), 8)
  assert.deepEqual(await buttons.allTextContents(), ['#b', '#a', '#c', '#d', '#e', '#f', '#g', '#h'])
  assert.equal(await page.getByLabel('Tỷ lệ chi theo bộ lọc').count(), 0)
  await buttons.first().click()
  await buttons.nth(1).click()
  assert.equal(await buttons.first().getAttribute('aria-pressed'), 'true')
  assert.equal(await buttons.nth(1).getAttribute('aria-pressed'), 'true')
  const chart = page.getByLabel('Tỷ lệ chi theo bộ lọc')
  assert.match(await chart.innerText(), /Tổng chi: 4/)
  assert.match(await chart.innerText(), /Khớp bộ lọc[\s\S]*1[^\n]*25%/)
  assert.match(await chart.innerText(), /Chi còn lại[\s\S]*3[^\n]*75%/)
  await page.screenshot({ path: `${process.env.TEMP}/montana-tag-chart-${width}.png`, fullPage: true })
  assert.equal(await page.getByText('match', { exact: true }).count(), 1)
  assert.equal(await page.getByText('match-two', { exact: true }).count(), 0)
  assert.equal(await page.getByText('other', { exact: true }).count(), 0)
  const search = page.getByLabel('Tìm ghi chú hoặc thẻ')
  await search.fill('match-two')
  assert.equal(await page.getByText('Không có giao dịch phù hợp').count(), 1)
  await page.getByRole('button', { name: 'Bỏ lọc thẻ a' }).click()
  assert.equal(await page.getByText('match-two', { exact: true }).count(), 1)
  await search.fill('#b')
  assert.equal(await page.getByText('match-two', { exact: true }).count(), 1)
  await page.getByRole('button', { name: 'Bộ lọc', exact: true }).click()
  await page.getByLabel('Nguồn tiền', { exact: true }).selectOption('bank')
  assert.match(await chart.innerText(), /Tổng chi: 1/)
  assert.match(await chart.innerText(), /Khớp bộ lọc[\s\S]*0[^\n]*0%/)
  await page.getByLabel('Nguồn tiền', { exact: true }).selectOption('')
  await page.getByRole('button', { name: 'Tháng trước' }).click()
  assert.match(await chart.innerText(), /Chưa có khoản chi trong tháng/)
  assert.match(await chart.innerText(), /Tổng chi: 0/)
  assert.equal(await chart.locator('.recharts-surface').count(), 0)
  await page.getByRole('button', { name: 'Tháng sau' }).click()
  await search.fill('không tìm thấy')
  assert.match(await chart.innerText(), /Khớp bộ lọc[\s\S]*0[^\n]*0%/)
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click()
  assert.equal(await search.inputValue(), '')
  assert.equal(await chart.count(), 0)
  await search.fill('#')
  assert.match(await chart.innerText(), /Khớp bộ lọc[\s\S]*4[^\n]*100%/)
  assert.match(await chart.innerText(), /Chi còn lại[\s\S]*0[^\n]*0%/)
  await search.clear()
  assert.equal(await chart.count(), 0)
  assert.equal(await buttons.first().getAttribute('aria-pressed'), 'false')
  assert.equal(await page.getByText('other', { exact: true }).count(), 1)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  if (await page.getByRole('button', { name: 'Bộ lọc', exact: true }).getAttribute('aria-expanded') === 'true') await page.getByRole('button', { name: 'Bộ lọc', exact: true }).click()
}
await page.evaluate(() => { const state = JSON.parse(localStorage.getItem('montana:v1')); state.tables.tags = []; state.tables.transactions = []; localStorage.setItem('montana:v1', JSON.stringify(state)) })
await page.reload()
assert.equal(await page.getByLabel('Thẻ phổ biến').count(), 0)
console.log('Popular tags: order, limit, filtering, empty state and responsive layout passed')
} finally {
  await browser.close()
}
