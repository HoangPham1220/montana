import type { Account, AssetCategory, Category } from './types'

type Seed<T> = Omit<T, 'updatedAt'>

export const DEFAULT_CATEGORIES: Seed<Category>[] = [
  { id: 'cat-food', name: 'Ăn uống', type: 'expense', color: '#f97316', icon: '🍜', budget: 0 },
  { id: 'cat-transport', name: 'Di chuyển', type: 'expense', color: '#0ea5e9', icon: '🛵', budget: 0 },
  { id: 'cat-housing', name: 'Nhà ở & hoá đơn', type: 'expense', color: '#8b5cf6', icon: '🏠', budget: 0 },
  { id: 'cat-shopping', name: 'Mua sắm', type: 'expense', color: '#ec4899', icon: '🛍️', budget: 0 },
  { id: 'cat-health', name: 'Sức khoẻ', type: 'expense', color: '#10b981', icon: '💊', budget: 0 },
  { id: 'cat-entertain', name: 'Giải trí', type: 'expense', color: '#eab308', icon: '🎮', budget: 0 },
  { id: 'cat-education', name: 'Học tập', type: 'expense', color: '#6366f1', icon: '📚', budget: 0 },
  { id: 'cat-other-exp', name: 'Khác', type: 'expense', color: '#64748b', icon: '📦', budget: 0 },
  { id: 'cat-salary', name: 'Lương', type: 'income', color: '#16a34a', icon: '💼', budget: 0 },
  { id: 'cat-bonus', name: 'Thưởng', type: 'income', color: '#22c55e', icon: '🎁', budget: 0 },
  { id: 'cat-invest-inc', name: 'Lãi đầu tư', type: 'income', color: '#14b8a6', icon: '📈', budget: 0 },
  { id: 'cat-other-inc', name: 'Thu khác', type: 'income', color: '#84cc16', icon: '💰', budget: 0 },
]

export const DEFAULT_ASSET_CATEGORIES: Seed<AssetCategory>[] = [
  { id: 'acat-cash', name: 'Tiền mặt & tài khoản', color: '#64748b', targetPercent: 0 },
  { id: 'acat-savings', name: 'Tiết kiệm', color: '#0ea5e9', targetPercent: 0 },
  { id: 'acat-stock', name: 'Cổ phiếu / Quỹ', color: '#6366f1', targetPercent: 0 },
  { id: 'acat-gold', name: 'Vàng', color: '#eab308', targetPercent: 0 },
  { id: 'acat-crypto', name: 'Crypto', color: '#f97316', targetPercent: 0 },
  { id: 'acat-realestate', name: 'Bất động sản', color: '#10b981', targetPercent: 0 },
]

export const DEFAULT_ACCOUNT_ID = 'acc-cash'

export const DEFAULT_ACCOUNTS: Seed<Account>[] = [
  { id: 'acc-cash', name: 'Tiền mặt', kind: 'cash', openingBalance: 0, currentBalance: 0, color: '#16a34a', icon: '💵', archived: false },
]
