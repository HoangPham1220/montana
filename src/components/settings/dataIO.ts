import { TABLE_NAMES, type Tables } from '../../lib/types'
import { DEFAULT_ACCOUNT_ID } from '../../lib/defaults'
import { getState, importTables as importIntoStore } from '../../lib/store'
import { today } from '../../lib/format'
import { categoryLabel } from '../../lib/categoryTree'

export function download(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function exportJson() {
  const { tables } = getState()
  const payload = { app: 'montana', version: 1, exportedAt: new Date().toISOString(), tables }
  download(`montana-backup-${today()}.json`, JSON.stringify(payload, null, 2), 'application/json')
}

const csvCell = (v: string | number) => {
  const s = String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportTransactionsCsv() {
  const { tables } = getState()
  const cats = new Map(tables.categories.map((c) => [c.id, c]))
  const accs = new Map(tables.accounts.map((a) => [a.id, a.name]))
  const accName = (id: string) => accs.get(id || DEFAULT_ACCOUNT_ID) ?? ''
  const typeLabel = { expense: 'Chi', income: 'Thu', transfer: 'Chuyển', adjustment: 'Điều chỉnh số dư' } as const
  const rows = tables.transactions
    .filter((t) => !t.deleted)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [
      t.date,
      typeLabel[t.type] ?? 'Chi',
      t.type === 'adjustment' ? '' : categoryLabel(cats.get(t.categoryId), tables.categories),
      accName(t.accountId),
      t.type === 'transfer' ? accName(t.toAccountId) : '',
      t.amount,
      t.note,
    ])
  const header = ['Ngày', 'Loại', 'Danh mục', 'Nguồn tiền', 'Đến', 'Số tiền', 'Ghi chú']
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
  download(`montana-giao-dich-${today()}.csv`, '﻿' + csv, 'text/csv;charset=utf-8')
}

/** Parse a backup file; returns tables or throws a Vietnamese error message. */
export function parseBackup(text: string): Partial<Tables> {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('File không phải JSON hợp lệ.')
  }
  const src = (json as { tables?: unknown })?.tables ?? json
  if (!src || typeof src !== 'object') throw new Error('Cấu trúc file không đúng.')
  const out: Partial<Tables> = {}
  let found = false
  for (const t of TABLE_NAMES) {
    const rows = (src as Record<string, unknown>)[t]
    if (rows === undefined) continue
    if (!Array.isArray(rows)) throw new Error(`Bảng "${t}" không hợp lệ.`)
    ;(out as Record<string, unknown[]>)[t] = rows.filter((r) => r && typeof r === 'object' && typeof (r as { id?: unknown }).id === 'string')
    found = true
  }
  if (!found) throw new Error('Không tìm thấy bảng dữ liệu nào trong file.')
  return out
}

export const importTables = (tables: Partial<Tables>): number => importIntoStore(tables)

export const countRecords = (tables: Partial<Tables>) => TABLE_NAMES.reduce((n, t) => n + (tables[t]?.length ?? 0), 0)
