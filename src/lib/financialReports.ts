import type { Account, Asset, AssetCategory, FinancialSnapshot } from './types'

export interface SnapshotData {
  accounts: Account[]
  assets: Asset[]
  assetCategories: AssetCategory[]
}

export function parseSnapshot(snapshot: FinancialSnapshot): SnapshotData {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(snapshot.month) || snapshot.id !== `financial:${snapshot.month}` ||
    !/^\d{4}-\d{2}-\d{2}$/.test(snapshot.scheduledDate) || snapshot.scheduledDate.slice(0, 7) !== snapshot.month ||
    !Number.isFinite(Date.parse(snapshot.capturedAt)) || snapshot.deleted || typeof snapshot.data !== 'string' || snapshot.data.length > 45000) {
    throw new Error('Thông tin kỳ snapshot không hợp lệ.')
  }
  const data = JSON.parse(snapshot.data) as SnapshotData
  if (!data || !Array.isArray(data.accounts) || !Array.isArray(data.assets) || !Array.isArray(data.assetCategories) ||
    data.accounts.some((a) => !a || typeof a.id !== 'string' || typeof a.name !== 'string' || !Number.isFinite(a.currentBalance)) ||
    data.assets.some((a) => !a || typeof a.id !== 'string' || typeof a.categoryId !== 'string' || typeof a.unit !== 'string' || typeof a.name !== 'string' || !Number.isFinite(a.currentValue) || !Number.isFinite(a.costBasis) || !Number.isFinite(a.quantity)) ||
    data.assetCategories.some((c) => !c || typeof c.id !== 'string' || typeof c.name !== 'string')) {
    throw new Error('Snapshot không hợp lệ. Hãy kiểm tra dữ liệu sao lưu hoặc Google Sheet.')
  }
  return data
}

export function snapshotTotals(data: SnapshotData) {
  const cash = data.accounts.reduce((sum, a) => sum + a.currentBalance, 0)
  const invested = data.assets.reduce((sum, a) => sum + a.currentValue, 0)
  const cost = data.assets.reduce((sum, a) => sum + a.costBasis, 0)
  return { cash, invested, cost, total: cash + invested }
}
