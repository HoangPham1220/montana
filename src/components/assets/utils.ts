import { getState, upsert } from '../../lib/store'
import { today } from '../../lib/format'
import type { Asset, AssetCategory, AssetSnapshot } from '../../lib/types'

export const SWATCHES = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#84cc16']
export const UNIT_SUGGESTIONS = ['VND', 'chỉ', 'lượng', 'cổ phiếu', 'BTC', 'ETH', 'USD', 'm²', 'quỹ']
export const UNCATEGORIZED_ID = '__none__'
export const UNCATEGORIZED_COLOR = '#94a3b8'

/** Upsert today's snapshot for an asset (update if one already exists). */
export function saveSnapshot(assetId: string, value: number) {
  const date = today()
  const existing = getState().tables.assetSnapshots.find((s) => !s.deleted && s.assetId === assetId && s.date === date)
  upsert('assetSnapshots', existing ? { ...existing, value } : { assetId, date, value })
}

/** Save an asset and keep today's snapshot in sync when created / value changed. */
export function saveAsset(draft: Omit<Asset, 'id' | 'updatedAt'> & { id?: string }) {
  const prev = draft.id ? getState().tables.assets.find((a) => a.id === draft.id) : undefined
  const saved = upsert('assets', draft)
  if (!prev || prev.currentValue !== draft.currentValue) saveSnapshot(saved.id, draft.currentValue)
  return saved
}

const localDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface HistoryPoint { date: string; total: number }

/** Net worth per date: latest snapshot per asset (carry forward); deleted assets count 0 from deletion date. */
export function buildHistory(
  allAssets: Asset[],
  snapshots: AssetSnapshot[],
  /** Optional extra dates to plot and an extra amount (e.g. account balances) added at each date. */
  extra?: { dates: string[]; valueAt: (date: string) => number },
): HistoryPoint[] {
  const byAsset = new Map<string, AssetSnapshot[]>()
  for (const s of snapshots) {
    if (s.deleted) continue
    const l = byAsset.get(s.assetId)
    if (l) l.push(s)
    else byAsset.set(s.assetId, [s])
  }
  byAsset.forEach((l) => l.sort((a, b) => a.date.localeCompare(b.date)))
  const known = new Map(allAssets.map((a) => [a.id, a]))
  const deletedAt = new Map<string, string>()
  for (const a of allAssets) if (a.deleted) deletedAt.set(a.id, localDate(a.updatedAt))

  const dates = new Set<string>()
  byAsset.forEach((l, id) => {
    if (!known.has(id)) return
    l.forEach((s) => dates.add(s.date))
  })
  deletedAt.forEach((d, id) => byAsset.has(id) && dates.add(d))
  extra?.dates.forEach((d) => dates.add(d))

  return Array.from(dates)
    .sort()
    .map((date) => {
      let total = extra ? extra.valueAt(date) : 0
      byAsset.forEach((l, id) => {
        if (!known.has(id)) return
        const del = deletedAt.get(id)
        if (del && date >= del) return
        let v = 0
        for (const s of l) {
          if (s.date > date) break
          v = s.value
        }
        total += v
      })
      return { date, total }
    })
}

export const catOf = (cats: AssetCategory[], id: string) => cats.find((c) => c.id === id)
