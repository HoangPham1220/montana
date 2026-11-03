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
  state.tables.transactions = [tx('match', ['b']), tx('match-two', ['b']), tx('other', ['a']), tx('deleted', ['i'], true)]
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
  await buttons.first().click()
  assert.equal(await page.getByLabel('Tìm ghi chú hoặc thẻ').inputValue(), '#b')
  assert.equal(await buttons.first().getAttribute('aria-pressed'), 'true')
  assert.equal(await page.getByText('match', { exact: true }).count(), 1)
  assert.equal(await page.getByText('other', { exact: true }).count(), 0)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
}
await page.evaluate(() => { const state = JSON.parse(localStorage.getItem('montana:v1')); state.tables.tags = []; state.tables.transactions = []; localStorage.setItem('montana:v1', JSON.stringify(state)) })
await page.reload()
assert.equal(await page.getByLabel('Thẻ phổ biến').count(), 0)
console.log('Popular tags: order, limit, filtering, empty state and responsive layout passed')
} finally {
  await browser.close()
}
