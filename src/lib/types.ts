// Shared data contract. Every table maps 1:1 to a Google Sheet tab of the same
// name; row 1 of each tab holds the field names below (order = SHEET_COLUMNS).

export type TxType = 'expense' | 'income'
/** Transaction kind: categories only use TxType; transactions may also be transfers. */
export type TransactionType = TxType | 'transfer'

interface BaseRecord {
  id: string
  /** ISO timestamp, used for last-write-wins merge. */
  updatedAt: string
  /** Soft delete so deletions sync across devices. */
  deleted?: boolean
}

export interface Category extends BaseRecord {
  name: string
  type: TxType
  color: string
  icon: string
  /** Monthly budget in VND, 0 = none. Only meaningful for expense categories. */
  budget: number
}

export interface Transaction extends BaseRecord {
  /** YYYY-MM-DD */
  date: string
  type: TransactionType
  amount: number
  /** '' for transfers. */
  categoryId: string
  /** Source account; '' in legacy rows = default account. */
  accountId: string
  /** Destination account, only for transfers, else ''. */
  toAccountId: string
  note: string
}

export type AccountKind = 'cash' | 'bank' | 'ewallet' | 'credit'

/** Money account / wallet ("Nguồn tiền"). Credit cards usually have negative balance (debt). */
export interface Account extends BaseRecord {
  name: string
  kind: AccountKind
  openingBalance: number
  color: string
  icon: string
  archived: boolean
}

/** Asset class, e.g. Tiền mặt, Tiết kiệm, Cổ phiếu, Vàng, Crypto, Bất động sản. */
export interface AssetCategory extends BaseRecord {
  name: string
  color: string
  /** Target allocation in percent (0-100), 0 = none. */
  targetPercent: number
}

export interface Asset extends BaseRecord {
  name: string
  categoryId: string
  quantity: number
  unit: string
  /** Total money put in (VND). */
  costBasis: number
  /** Current total market value (VND). */
  currentValue: number
  note: string
}

/** Point-in-time value of an asset, for net-worth history charts. */
export interface AssetSnapshot extends BaseRecord {
  assetId: string
  /** YYYY-MM-DD */
  date: string
  value: number
}

export interface Tables {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  assetCategories: AssetCategory[]
  assets: Asset[]
  assetSnapshots: AssetSnapshot[]
}

export type TableName = keyof Tables
export type RecordOf<T extends TableName> = Tables[T][number]

export const TABLE_NAMES: TableName[] = [
  'accounts',
  'categories',
  'transactions',
  'assetCategories',
  'assets',
  'assetSnapshots',
]

export const SHEET_COLUMNS: { [K in TableName]: (keyof RecordOf<K>)[] } = {
  accounts: ['id', 'name', 'kind', 'openingBalance', 'color', 'icon', 'archived', 'updatedAt', 'deleted'],
  categories: ['id', 'name', 'type', 'color', 'icon', 'budget', 'updatedAt', 'deleted'],
  transactions: ['id', 'date', 'type', 'amount', 'categoryId', 'accountId', 'toAccountId', 'note', 'updatedAt', 'deleted'],
  assetCategories: ['id', 'name', 'color', 'targetPercent', 'updatedAt', 'deleted'],
  assets: ['id', 'name', 'categoryId', 'quantity', 'unit', 'costBasis', 'currentValue', 'note', 'updatedAt', 'deleted'],
  assetSnapshots: ['id', 'assetId', 'date', 'value', 'updatedAt', 'deleted'],
}

// ---- Apps Script API contract ----
// Request: POST <webAppUrl>, Content-Type: text/plain (avoids CORS preflight),
// body = JSON.stringify(ApiRequest). Response body = JSON ApiResponse.
export type ApiRequest =
  | { token: string; action: 'ping' }
  | { token: string; action: 'pull' }
  | { token: string; action: 'push'; changes: Partial<Tables> }

export type ApiResponse =
  | { ok: true; serverTime: string; data?: Tables }
  | { ok: false; error: string }
