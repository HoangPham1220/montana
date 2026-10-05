// Mock test for apps-script/Code.gs. Runs the real backend source inside a Node
// `vm` context with in-memory fakes of SpreadsheetApp / PropertiesService / ...
// Usage (from project root):  node scripts/test-apps-script.cjs
// Exit code 0 = all PASS, 1 = at least one FAIL.
const fs = require('fs')
const path = require('path')
const vm = require('vm')

// ---------------------------------------------------------------- mock Sheet
class Sheet {
  constructor(name) {
    this.name = name
    this.data = [] // 2D array, row-major, 0-based
    this.maxRows = 1000 // like a real sheet: writing beyond it throws
    this.formats = {} // 'col' -> last number format applied to data rows
  }
  getLastRow() { return this.data.length }
  getLastColumn() { return Math.max(0, ...this.data.map((r) => r.length)) }
  getMaxRows() { return this.maxRows }
  insertRowsAfter(_after, n) { this.maxRows += n }
  setFrozenRows() {}
  getRange(r, c, nr = 1, nc = 1) {
    const sh = this
    return {
      getValues() {
        const out = []
        for (let i = 0; i < nr; i++) {
          const row = []
          for (let j = 0; j < nc; j++) {
            const v = (sh.data[r - 1 + i] || [])[c - 1 + j]
            row.push(v === undefined ? '' : v)
          }
          out.push(row)
        }
        return out
      },
      setValues(v) {
        if (v.length !== nr || v[0].length !== nc) throw new Error(`size mismatch ${v.length}x${v[0].length} vs ${nr}x${nc}`)
        if (r - 1 + nr > sh.maxRows) throw new Error('beyond max rows')
        for (let i = 0; i < nr; i++) {
          sh.data[r - 1 + i] = sh.data[r - 1 + i] || []
          for (let j = 0; j < nc; j++) sh.data[r - 1 + i][c - 1 + j] = v[i][j]
        }
        return this
      },
      setNumberFormat(f) { if (r > 1) sh.formats[c] = f; return this },
      setFontWeight() { return this },
    }
  }
}

const sheets = {}
const ss = {
  getSheetByName: (n) => sheets[n] || null,
  insertSheet: (n) => (sheets[n] = new Sheet(n)),
}
const props = { API_TOKEN: 'secret' }
const menuItems = []
const ctx = {
  SpreadsheetApp: {
    getActiveSpreadsheet: () => ss,
    getUi: () => ({
      createMenu: () => ({
        addItem(label, fn) { menuItems.push(fn); return this },
        addToUi() {},
      }),
      alert() {},
    }),
  },
  ContentService: {
    MimeType: { JSON: 'json' },
    createTextOutput: (t) => ({ t, setMimeType() { return this } }),
  },
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: (k) => props[k] ?? null,
      setProperty: (k, v) => (props[k] = v),
    }),
  },
  LockService: { getScriptLock: () => ({ waitLock() {}, tryLock() { return true }, releaseLock() {} }) },
  Utilities: { getUuid: () => 'uuid-1234', formatDate: (d) => d.toISOString().slice(0, 10) },
  Logger: { log() {} },
  Session: { getScriptTimeZone: () => 'Asia/Ho_Chi_Minh' },
  console, Date, JSON,
}
vm.createContext(ctx)
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8'), ctx)

// ---------------------------------------------------------------- tiny harness
let failed = 0
function check(name, cond, detail) {
  if (cond) console.log(`PASS  ${name}`)
  else { failed++; console.log(`FAIL  ${name}${detail !== undefined ? '  -> ' + JSON.stringify(detail) : ''}`) }
}
const send = (body) => JSON.parse(ctx.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } }).t)
const T = 'secret'
const tx = (id, amount, updatedAt, extra = {}) => ({
  id, date: '2026-09-30', type: 'expense', amount, categoryId: 'cat-food', accountId: '', toAccountId: '', note: 'phở, "ngon"', updatedAt, deleted: false, ...extra,
})

// ---------------------------------------------------------------- auth / routing
check('doGet returns ok + service', (() => { const g = JSON.parse(ctx.doGet({}).t); return g.ok === true && g.service === 'montana' })())
check('wrong token -> Unauthorized', send({ token: 'x', action: 'pull' }).error === 'Unauthorized')
check('token of same length but different -> Unauthorized', send({ token: 'secreT', action: 'pull' }).ok === false)
check('missing token -> Unauthorized', send({ action: 'pull' }).ok === false)
check('malformed JSON -> Bad request', /^Bad request/.test(send('{not json').error || ''))
check('unknown action -> error', send({ token: T, action: 'nope' }).error === 'Unknown action')
check('ping ok with serverTime', (() => { const r = send({ token: T, action: 'ping' }); return r.ok && !!r.serverTime && r.data === undefined })())

// ---------------------------------------------------------------- pull creates tabs
let r = send({ token: T, action: 'pull' })
check('pull ok and returns all 7 tables', r.ok && ['accounts', 'categories', 'transactions', 'assetCategories', 'assets', 'assetSnapshots', 'appSettings'].every((t) => Array.isArray(r.data[t])), r.data && Object.keys(r.data))
check('tabs created with header row', Object.keys(sheets).length === 7 && Object.keys(r.data).join() === 'accounts,categories,transactions,assetCategories,assets,assetSnapshots,appSettings' && sheets.transactions.data[0].join() === 'id,date,type,amount,categoryId,accountId,toAccountId,note,updatedAt,deleted' && sheets.accounts.data[0].join() === 'id,name,kind,openingBalance,color,icon,archived,updatedAt,deleted' && sheets.appSettings.data[0].join() === 'id,autoSync,moneyInputMultiplier,moneyInputCurrencyCode,updatedAt,deleted', sheets.transactions && sheets.transactions.data[0])

// ---------------------------------------------------------------- push / LWW
r = send({ token: T, action: 'push', changes: { transactions: [tx('a', 50000, '2026-09-30T01:00:00Z'), tx('b', 30000, '2026-09-30T01:00:00Z')] } })
check('push inserts 2 rows and echoes full dataset', r.ok && r.data.transactions.length === 2)
const a = r.data.transactions.find((t) => t.id === 'a')
check('types round-trip (number / string / boolean)', a.amount === 50000 && a.note === 'phở, "ngon"' && a.deleted === false && a.date === '2026-09-30', a)

r = send({ token: T, action: 'push', changes: { transactions: [tx('a', 99999, '2026-09-29T00:00:00Z'), tx('b', 77777, '2026-09-30T02:00:00Z')] } })
const amt = Object.fromEntries(r.data.transactions.map((t) => [t.id, t.amount]))
check('LWW: older write loses', amt.a === 50000, amt)
check('LWW: newer write wins', amt.b === 77777, amt)

r = send({ token: T, action: 'push', changes: { transactions: [tx('a', 11111, '2026-09-30T01:00:00Z')] } })
check('LWW: equal updatedAt wins (>=)', r.data.transactions.find((t) => t.id === 'a').amount === 11111)

r = send({ token: T, action: 'push', changes: { transactions: [tx('a', 0, '2026-10-01T00:00:00Z', { deleted: true })] } })
check('soft delete is stored as deleted=true (row kept)', r.data.transactions.find((t) => t.id === 'a').deleted === true && r.data.transactions.length === 2)

r = send({ token: T, action: 'push', changes: { transactions: [tx('', 1, '2026-10-01T00:00:00Z'), { amount: 5 }] } })
check('rows without id are ignored', r.ok && r.data.transactions.length === 2)

r = send({ token: T, action: 'push', changes: { transactions: [tx('d1', 1, 'T1'), tx('d1', 2, 'T2')] } })
check('same id twice in one push -> single row, last wins', r.data.transactions.filter((t) => t.id === 'd1').length === 1 && r.data.transactions.find((t) => t.id === 'd1').amount === 2)

r = send({ token: T, action: 'push', changes: { transactions: [tx('n1', 'abc', '2026-10-02T00:00:00Z')] } })
check('non-numeric amount is coerced to 0', r.data.transactions.find((t) => t.id === 'n1').amount === 0)

// ---------------------------------------------------------------- accounts / transfer
const acc = (id, extra = {}) => ({ id, name: 'Ví "MoMo"', kind: 'ewallet', openingBalance: -250000, color: '#a50064', icon: 'wallet', archived: true, updatedAt: '2026-10-05T00:00:00Z', deleted: false, ...extra })
r = send({ token: T, action: 'push', changes: { accounts: [acc('acc1'), acc('acc2', { kind: 'cash', openingBalance: 1500000.5, archived: false })] } })
const a1 = r.ok && r.data.accounts.find((x) => x.id === 'acc1')
const a2 = r.ok && r.data.accounts.find((x) => x.id === 'acc2')
check('accounts round trip incl. negative openingBalance + archived boolean', a1 && a1.openingBalance === -250000 && a1.archived === true && a1.kind === 'ewallet' && a1.name === 'Ví "MoMo"' && a1.deleted === false && a2.openingBalance === 1500000.5 && a2.archived === false, r.data && r.data.accounts)
check('accounts stored typed in sheet (number / boolean)', (() => { const h = sheets.accounts.data[0]; const rw = sheets.accounts.data[1]; return rw[h.indexOf('openingBalance')] === -250000 && rw[h.indexOf('archived')] === true })())
r = send({ token: T, action: 'push', changes: { accounts: [acc('acc1', { archived: 'false', updatedAt: '2026-10-06T00:00:00Z' })] } })
check('accounts update: archived string "false" coerces to false', r.data.accounts.find((x) => x.id === 'acc1').archived === false)

r = send({ token: T, action: 'push', changes: { transactions: [tx('tr1', 200000, '2026-10-05T00:00:00Z', { type: 'transfer', categoryId: '', accountId: 'acc1', toAccountId: 'acc2' })] } })
const tr = r.data.transactions.find((t) => t.id === 'tr1')
check('transfer transaction round trips accountId/toAccountId', tr && tr.type === 'transfer' && tr.accountId === 'acc1' && tr.toAccountId === 'acc2' && tr.categoryId === '' && tr.amount === 200000, tr)

// ---------------------------------------------------------------- migration (old 8-column transactions header)
{
  delete sheets.transactions
  const old = (sheets.transactions = new Sheet('transactions'))
  old.data = [
    ['id', 'date', 'type', 'amount', 'categoryId', 'note', 'updatedAt', 'deleted'],
    ['o1', '2026-08-01', 'expense', 12000, 'cat-food', 'cũ 1', '2026-08-01T00:00:00Z', false],
    ['o2', '2026-08-02', 'income', 900000, 'cat-salary', 'cũ 2', '2026-08-02T00:00:00Z', 'TRUE'],
  ]
  r = send({ token: T, action: 'pull' })
  const o1 = r.data.transactions.find((t) => t.id === 'o1')
  const o2 = r.data.transactions.find((t) => t.id === 'o2')
  check('migration: header gained accountId,toAccountId at the end', old.data[0].join() === 'id,date,type,amount,categoryId,note,updatedAt,deleted,accountId,toAccountId', old.data[0])
  check('migration: old rows read accountId/toAccountId as "" (not undefined/null)', o1 && o2 && o1.accountId === '' && o1.toAccountId === '' && o2.accountId === '' && o2.toAccountId === '', [o1, o2])
  check('migration: old values intact', o1.amount === 12000 && o1.note === 'cũ 1' && o1.categoryId === 'cat-food' && o1.deleted === false && o2.amount === 900000 && o2.type === 'income' && o2.deleted === true && o2.date === '2026-08-02', [o1, o2])
  r = send({ token: T, action: 'push', changes: { transactions: [tx('o1', 34000, '2026-10-07T00:00:00Z', { accountId: 'acc2', note: 'sửa' }), tx('o3', 5, '2026-10-07T00:00:00Z', { accountId: 'acc1', toAccountId: 'acc2', type: 'transfer' })] } })
  const h = old.data[0]
  const rowOf = (id) => old.data.find((x, i) => i > 0 && x[h.indexOf('id')] === id)
  const w1 = rowOf('o1'), w2 = rowOf('o2'), w3 = rowOf('o3')
  check('migration: update of old row lands in correct columns', w1[h.indexOf('amount')] === 34000 && w1[h.indexOf('accountId')] === 'acc2' && w1[h.indexOf('toAccountId')] === '' && w1[h.indexOf('note')] === 'sửa' && w1[h.indexOf('categoryId')] === 'cat-food' && w1[h.indexOf('updatedAt')] === '2026-10-07T00:00:00Z' && w1.length === 10, w1)
  check('migration: untouched old row unchanged; appended row correct', w2[h.indexOf('note')] === 'cũ 2' && w2[h.indexOf('amount')] === 900000 && w3[h.indexOf('toAccountId')] === 'acc2' && w3[h.indexOf('type')] === 'transfer', [w2, w3])
  check('migration: push response reads back merged rows', r.ok && r.data.transactions.find((t) => t.id === 'o1').accountId === 'acc2' && r.data.transactions.length === 3)
  // restore a fresh table so later tests are unaffected
  delete sheets.transactions
  send({ token: T, action: 'pull' })
  send({ token: T, action: 'push', changes: { transactions: [tx('a', 1, '2026-10-01T00:00:00Z'), tx('b', 1, '2026-10-01T00:00:00Z')] } })
}

// ---------------------------------------------------------------- Sheet-side quirks
const sh = sheets.transactions
const dateCol = sh.data[0].indexOf('date')
const row = sh.data.findIndex((x) => x[sh.data[0].indexOf('id')] === 'b')
sh.data[row][dateCol] = new Date('2026-09-30T00:00:00Z') // Sheets auto-converted text to a Date
r = send({ token: T, action: 'pull' })
check('Date cell in "date" column is read back as yyyy-MM-dd', r.data.transactions.find((t) => t.id === 'b').date === '2026-09-30')
const updCol = sh.data[0].indexOf('updatedAt')
sh.data[row][updCol] = new Date('2026-09-30T02:00:00Z')
r = send({ token: T, action: 'pull' })
check('Date cell in other text column is read back as ISO string', r.data.transactions.find((t) => t.id === 'b').updatedAt === '2026-09-30T02:00:00.000Z')

// extra user column + column reordering are preserved / tolerated
sh.data[0].push('myNote'); sh.data[row].push('keep me')
send({ token: T, action: 'push', changes: { transactions: [tx('b', 12345, '2027-01-01T00:00:00Z')] } })
check('extra (non-schema) column survives a push', sh.data[row][sh.data[0].indexOf('myNote')] === 'keep me')
check('extra column not leaked into API rows', !('myNote' in send({ token: T, action: 'pull' }).data.transactions[0]))

// ---------------------------------------------------------------- bulk (batching)
const many = Array.from({ length: 1500 }, (_, i) => tx('m' + i, i, '2026-10-03T00:00:00Z'))
r = send({ token: T, action: 'push', changes: { transactions: many } })
check('bulk push of 1500 rows (grows sheet past initial maxRows)', r.ok && r.data.transactions.length === 1500 + 2, r.ok ? r.data.transactions.length : r.error)
check('row 1 header untouched after bulk', sh.data[0][0] === 'id')

// ---------------------------------------------------------------- setup helpers / menu
delete props.API_TOKEN
check('setupToken creates a token when missing', ctx.setupToken() === 'uuid-1234' && props.API_TOKEN === 'uuid-1234')
props.API_TOKEN = 'kept'
check('setupToken keeps an existing token', ctx.setupToken() === 'kept')
check('no token configured -> Unauthorized', (() => { delete props.API_TOKEN; return send({ token: '', action: 'ping' }).ok === false })())
props.API_TOKEN = 'secret'
ctx.onOpen()
check('menu callbacks are public global functions', menuItems.length === 2 && menuItems.every((fn) => typeof ctx[fn] === 'function' && !fn.endsWith('_')), menuItems)

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks PASSED')
process.exitCode = failed ? 1 : 0
