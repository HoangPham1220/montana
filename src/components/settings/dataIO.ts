import { TABLE_NAMES, type Tables } from '../../lib/types'
import { DEFAULT_ACCOUNT_ID } from '../../lib/defaults'
import { getState, importTables as importIntoStore } from '../../lib/store'
import { today } from '../../lib/format'
import { categoryLabel } from '../../lib/categoryTree'
import { normalizeTagName, validTagName } from '../../lib/tags'
import { parseSnapshot } from '../../lib/financialReports'
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export async function download(filename: string, content: string, mime: string) {
  if (Capacitor.isNativePlatform()) {
    try {
      const { uri } = await Filesystem.writeFile({ path: filename, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 })
      await Share.share({ title: filename, files: [uri], dialogTitle: 'Lưu hoặc chia sẻ bản xuất' })
    } catch (e) {
      if (e instanceof Error && e.message === 'Share canceled') return
      window.alert(`Không thể xuất file. Vui lòng thử lại.\n${e instanceof Error ? e.message : String(e)}`)
    }
    return
  }
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

export const csvCell = (v: string | number) => {
  const s = typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportTransactionsCsv() {
  const { tables } = getState()
  const cats = new Map(tables.categories.map((c) => [c.id, c]))
  const tags = new Map(tables.tags.map((tag) => [tag.id, tag.name]))
  const accs = new Map(tables.accounts.map((a) => [a.id, a.name]))
  const accName = (id: string) => accs.get(id || DEFAULT_ACCOUNT_ID) ?? ''
  const typeLabel = { expense: 'Chi', income: 'Thu', transfer: 'Chuyển', adjustment: 'Điều chỉnh số dư' , investment: 'Đầu tư'} as const
  const rows = tables.transactions
    .filter((t) => !t.deleted)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [
      t.date,
      typeLabel[t.type] ?? 'Chi',
      t.type === 'adjustment' || t.type === 'investment' ? '' : categoryLabel(cats.get(t.categoryId), tables.categories),
      accName(t.accountId),
      t.type === 'transfer' ? accName(t.toAccountId) : '',
      t.amount,
      t.note,
      (t.tagIds ?? []).map((id) => tags.get(id)).filter(Boolean).map((name) => `#${name}`).join(' '),
    ])
  const header = ['Ngày', 'Loại', 'Danh mục', 'Nguồn tiền', 'Đến', 'Số tiền', 'Ghi chú', 'Thẻ']
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
  const combinedTags = new Map(getState().tables.tags.map((tag) => [tag.id, tag]))
  for (const tag of out.tags ?? []) {
    const previous = combinedTags.get(tag.id)
    if (!previous || previous.updatedAt <= tag.updatedAt) combinedTags.set(tag.id, tag)
  }
  const tagNames = new Set<string>()
  for (const tag of combinedTags.values()) {
    if (typeof tag.name !== 'string' || tag.name !== normalizeTagName(tag.name) || !validTagName(tag.name) || (!tag.deleted && tagNames.has(tag.name))) throw new Error('Dữ liệu thẻ không hợp lệ.')
    if (!tag.deleted) tagNames.add(tag.name)
  }
  for (const tx of out.transactions ?? []) {
    if (tx.tagIds !== undefined && (!Array.isArray(tx.tagIds) || tx.tagIds.length > 3 || new Set(tx.tagIds).size !== tx.tagIds.length || tx.tagIds.some((id) => typeof id !== 'string' || !id || !combinedTags.has(id) || combinedTags.get(id)?.deleted))) throw new Error('Thẻ giao dịch không hợp lệ.')
  }
  out.financialSnapshots?.forEach(parseSnapshot)
  return out
}

export const importTables = (tables: Partial<Tables>): number => importIntoStore(tables)

export const countRecords = (tables: Partial<Tables>) => TABLE_NAMES.reduce((n, t) => n + (tables[t]?.length ?? 0), 0)
