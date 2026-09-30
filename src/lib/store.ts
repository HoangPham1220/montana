// Offline-first store: everything lives in localStorage, changes are marked
// dirty and pushed to the Apps Script backend, then merged back last-write-wins.
import { useSyncExternalStore } from 'react'
import {
  TABLE_NAMES,
  type ApiRequest,
  type ApiResponse,
  type RecordOf,
  type TableName,
  type Tables,
} from './types'
import { DEFAULT_ACCOUNTS, DEFAULT_ASSET_CATEGORIES, DEFAULT_CATEGORIES } from './defaults'

export interface Settings {
  apiUrl: string
  token: string
  autoSync: boolean
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'error'
  lastSyncAt: string | null
  error: string | null
}

export interface State {
  tables: Tables
  /** ids per table changed locally since the last successful push */
  dirty: Record<TableName, string[]>
  settings: Settings
  sync: SyncState
}

const STORAGE_KEY = 'montana:v1'

const emptyTables = (): Tables => ({
  accounts: [],
  categories: [],
  transactions: [],
  assetCategories: [],
  assets: [],
  assetSnapshots: [],
})

const emptyDirty = (): Record<TableName, string[]> =>
  Object.fromEntries(TABLE_NAMES.map((t) => [t, []])) as unknown as Record<TableName, string[]>

function load(): State {
  const base: State = {
    tables: emptyTables(),
    dirty: emptyDirty(),
    settings: { apiUrl: '', token: '', autoSync: true },
    sync: { status: 'idle', lastSyncAt: null, error: null },
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      const tables: Tables = { ...base.tables, ...saved.tables }
      const dirty = { ...base.dirty, ...saved.dirty }
      // Migration: state saved before "Nguồn tiền" existed has no accounts table.
      if (!saved.tables?.accounts?.length) {
        const now = new Date(0).toISOString()
        tables.accounts = DEFAULT_ACCOUNTS.map((a) => ({ ...a, updatedAt: now }))
        dirty.accounts = Array.from(new Set([...(dirty.accounts ?? []), ...tables.accounts.map((a) => a.id)]))
      }
      // Old transactions lack accountId/toAccountId.
      tables.transactions = tables.transactions.map((t) => ({
        ...t,
        accountId: t.accountId ?? '',
        toAccountId: t.toAccountId ?? '',
      }))
      return {
        tables,
        dirty,
        settings: { ...base.settings, ...saved.settings },
        sync: { ...base.sync, lastSyncAt: saved.lastSyncAt ?? null },
      }
    }
  } catch {
    // corrupted storage: start fresh
  }
  // First run: seed defaults with stable ids so several devices merge cleanly.
  const now = new Date(0).toISOString()
  base.tables.accounts = DEFAULT_ACCOUNTS.map((a) => ({ ...a, updatedAt: now }))
  base.dirty.accounts = base.tables.accounts.map((a) => a.id)
  base.tables.categories = DEFAULT_CATEGORIES.map((c) => ({ ...c, updatedAt: now }))
  base.tables.assetCategories = DEFAULT_ASSET_CATEGORIES.map((c) => ({ ...c, updatedAt: now }))
  base.dirty.categories = base.tables.categories.map((c) => c.id)
  base.dirty.assetCategories = base.tables.assetCategories.map((c) => c.id)
  return base
}

let state: State = load()
const listeners = new Set<() => void>()
// Persist the seeded first-run state right away (persist is hoisted).
persist()

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tables: state.tables,
        dirty: state.dirty,
        settings: state.settings,
        lastSyncAt: state.sync.lastSyncAt,
      }),
    )
  } catch {
    // quota exceeded / private mode: keep working in memory
  }
}

function setState(next: State) {
  state = next
  persist()
  listeners.forEach((l) => l())
}

export function getState(): State {
  return state
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Subscribe to a slice of the store. Selector must return a stable reference. */
export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state))
}

/** Non-deleted rows of a table. Memoised per table array so it is render-stable. */
const liveCache = new WeakMap<object, unknown[]>()
export function useTable<T extends TableName>(table: T): RecordOf<T>[] {
  const rows = useStore((s) => s.tables[table]) as RecordOf<T>[]
  let live = liveCache.get(rows) as RecordOf<T>[] | undefined
  if (!live) {
    live = rows.filter((r) => !r.deleted)
    liveCache.set(rows, live)
  }
  return live
}

export function newId(): string {
  return crypto.randomUUID()
}

type Draft<T extends TableName> = Omit<RecordOf<T>, 'id' | 'updatedAt'> & { id?: string }

/** Create or update a record. Returns the saved record. */
export function upsert<T extends TableName>(table: T, draft: Draft<T>): RecordOf<T> {
  const record = { ...draft, id: draft.id ?? newId(), updatedAt: new Date().toISOString() } as RecordOf<T>
  const rows = state.tables[table] as RecordOf<T>[]
  const idx = rows.findIndex((r) => r.id === record.id)
  const nextRows = idx >= 0 ? rows.map((r, i) => (i === idx ? { ...r, ...record } : r)) : [...rows, record]
  markChanged(table, nextRows, [record.id])
  return record
}

/** Soft delete. */
export function remove(table: TableName, id: string) {
  const rows = state.tables[table] as RecordOf<TableName>[]
  const now = new Date().toISOString()
  const nextRows = rows.map((r) => (r.id === id ? { ...r, deleted: true, updatedAt: now } : r))
  markChanged(table, nextRows, [id])
}

function markChanged(table: TableName, rows: unknown[], ids: string[]) {
  const dirty = { ...state.dirty, [table]: Array.from(new Set([...state.dirty[table], ...ids])) }
  setState({ ...state, tables: { ...state.tables, [table]: rows } as Tables, dirty })
  scheduleSync()
}

/**
 * Bulk import (backup restore). Keeps each row's own updatedAt and merges
 * last-write-wins, so an old backup never clobbers newer edits. One write,
 * one sync. Returns number of rows applied.
 */
export function importTables(incoming: Partial<Tables>): number {
  const tables = { ...state.tables }
  const dirty = { ...state.dirty }
  let applied = 0
  for (const t of TABLE_NAMES) {
    const rows = (incoming[t] ?? []) as unknown as Record<string, unknown>[]
    if (!rows.length) continue
    const byId = new Map((tables[t] as RecordOf<TableName>[]).map((r) => [r.id, r]))
    const ids: string[] = []
    for (const raw of rows) {
      const rec = normalize(t, { updatedAt: new Date().toISOString(), ...raw })
      if (!rec.id) continue
      const cur = byId.get(rec.id)
      if (cur && cur.updatedAt > rec.updatedAt) continue
      byId.set(rec.id, rec)
      ids.push(rec.id)
      applied++
    }
    ;(tables as unknown as Record<string, unknown[]>)[t] = Array.from(byId.values())
    dirty[t] = Array.from(new Set([...dirty[t], ...ids]))
  }
  setState({ ...state, tables, dirty })
  scheduleSync()
  return applied
}

export function updateSettings(patch: Partial<Settings>) {
  setState({ ...state, settings: { ...state.settings, ...patch } })
}

// ---------------- sync ----------------

let syncTimer: ReturnType<typeof setTimeout> | undefined
function scheduleSync() {
  if (!state.settings.autoSync || !state.settings.apiUrl) return
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => void sync(), 1500)
}

async function call(req: ApiRequest): Promise<ApiResponse> {
  const res = await fetch(state.settings.apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(req),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as ApiResponse
}

export async function testConnection(): Promise<string> {
  const r = await call({ token: state.settings.token, action: 'ping' })
  if (!r.ok) throw new Error(r.error)
  return r.serverTime
}

function normalize(table: TableName, row: Record<string, unknown>): RecordOf<TableName> {
  // Sheets return numbers as numbers but may give '' for empty cells and
  // booleans as TRUE/FALSE strings.
  const out: Record<string, unknown> = { ...row }
  for (const k of ['amount', 'budget', 'targetPercent', 'quantity', 'costBasis', 'currentValue', 'value', 'openingBalance']) {
    if (k in out) out[k] = Number(out[k]) || 0
  }
  const toBool = (v: unknown) => v === true || v === 'TRUE' || v === 'true'
  out.deleted = toBool(out.deleted)
  if (table === 'accounts' || 'archived' in out) out.archived = toBool(out.archived)
  for (const k of ['id', 'updatedAt', 'date', 'name', 'note', 'categoryId', 'assetId', 'unit', 'color', 'icon', 'type', 'kind', 'accountId', 'toAccountId']) {
    if (k in out) out[k] = out[k] == null ? '' : String(out[k])
  }
  if (table === 'transactions') {
    out.accountId = out.accountId == null ? '' : String(out.accountId)
    out.toAccountId = out.toAccountId == null ? '' : String(out.toAccountId)
  }
  if (table === 'transactions' || table === 'assetSnapshots') {
    // Sheets may turn YYYY-MM-DD into a Date; the backend sends ISO strings.
    out.date = String(out.date).slice(0, 10)
  }
  return out as unknown as RecordOf<TableName>
}

let inFlight: Promise<void> | null = null

/** Push dirty rows then pull everything and merge last-write-wins. */
export function sync(): Promise<void> {
  if (inFlight) return inFlight
  if (!state.settings.apiUrl) return Promise.resolve()
  inFlight = doSync().finally(() => {
    inFlight = null
  })
  return inFlight
}

async function doSync() {
  setState({ ...state, sync: { ...state.sync, status: 'syncing', error: null } })
  try {
    const pushed = state.dirty
    const changes: Partial<Tables> = {}
    const pushedVersions = new Map<string, string>()
    for (const t of TABLE_NAMES) {
      if (!pushed[t].length) continue
      const ids = new Set(pushed[t])
      const rows = (state.tables[t] as RecordOf<TableName>[]).filter((r) => ids.has(r.id))
      rows.forEach((r) => pushedVersions.set(`${t}:${r.id}`, r.updatedAt))
      ;(changes as Record<string, unknown>)[t] = rows
    }
    const hasChanges = Object.keys(changes).length > 0
    const res = await call(
      hasChanges
        ? { token: state.settings.token, action: 'push', changes }
        : { token: state.settings.token, action: 'pull' },
    )
    if (!res.ok) throw new Error(res.error)
    if (!res.data) throw new Error('Phản hồi thiếu dữ liệu')

    // Merge server data with local state (local may have changed mid-flight).
    const tables = emptyTables()
    const dirty = emptyDirty()
    for (const t of TABLE_NAMES) {
      const byId = new Map<string, RecordOf<TableName>>()
      for (const row of res.data[t] ?? []) {
        const n = normalize(t, row as unknown as Record<string, unknown>)
        if (n.id) byId.set(n.id, n)
      }
      for (const local of state.tables[t] as RecordOf<TableName>[]) {
        const remote = byId.get(local.id)
        if (!remote || local.updatedAt > remote.updatedAt) byId.set(local.id, local)
      }
      ;(tables as unknown as Record<string, unknown[]>)[t] = Array.from(byId.values())
      // Still dirty if edited after we pushed it.
      dirty[t] = state.dirty[t].filter((id) => {
        const cur = (state.tables[t] as RecordOf<TableName>[]).find((r) => r.id === id)
        return !cur || pushedVersions.get(`${t}:${id}`) !== cur.updatedAt
      })
    }
    setState({
      ...state,
      tables,
      dirty,
      sync: { status: 'idle', lastSyncAt: res.serverTime, error: null },
    })
  } catch (e) {
    setState({ ...state, sync: { ...state.sync, status: 'error', error: (e as Error).message } })
  }
}

export function pendingCount(s: State): number {
  return TABLE_NAMES.reduce((n, t) => n + s.dirty[t].length, 0)
}
