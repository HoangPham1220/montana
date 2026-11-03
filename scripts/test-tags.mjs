// Run with the dev server on port 5173 and a Playwright module path.
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
} finally {
  await browser.close()
}
