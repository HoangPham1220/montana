// Money accounts ("Nguồn tiền"): balance maths shared by all pages.
import { useMemo } from 'react'
import { DEFAULT_ACCOUNT_ID } from './defaults'
import { useTable } from './store'
import type { Account, AccountKind, Transaction } from './types'

/** Account balances count toward this asset category on the Assets page. */
export const ACCOUNTS_ASSET_CATEGORY_ID = 'acat-cash'

export const ACCOUNT_KIND_LABEL: Record<AccountKind, string> = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
  ewallet: 'Ví điện tử',
  credit: 'Thẻ tín dụng',
}

const KIND_ORDER: AccountKind[] = ['cash', 'bank', 'ewallet', 'credit']

/** Source account of a transaction; legacy rows ('' ) belong to the default account. */
export function txAccountId(t: Transaction): string {
  return t.accountId || DEFAULT_ACCOUNT_ID
}

/** True for income/expense rows (i.e. not a transfer) — use in spending/income reports. */
export function isIncomeOrExpense(t: Transaction): boolean {
  return t.type !== 'transfer'
}

/** Effect of a transaction on one account's balance. */
export function accountDelta(t: Transaction, accountId: string): number {
  if (t.type === 'income') return txAccountId(t) === accountId ? t.amount : 0
  if (t.type === 'expense') return txAccountId(t) === accountId ? -t.amount : 0
  const from = txAccountId(t)
  const to = t.toAccountId
  if (from === to) return 0
  return (from === accountId ? -t.amount : 0) + (to === accountId ? t.amount : 0)
}

/**
 * openingBalance + all deltas per given account. `txs` should be live rows;
 * deleted ones are skipped anyway. `asOf` (YYYY-MM-DD) is inclusive.
 * Transactions referencing unknown account ids are ignored.
 */
export function computeBalances(accounts: Account[], txs: Transaction[], asOf?: string): Map<string, number> {
  const bal = new Map<string, number>(accounts.map((a) => [a.id, a.openingBalance]))
  for (const t of txs) {
    if (t.deleted || (asOf && t.date > asOf)) continue
    const from = txAccountId(t)
    if (t.type === 'transfer') {
      if (from === t.toAccountId) continue
      if (bal.has(from)) bal.set(from, bal.get(from)! - t.amount)
      if (bal.has(t.toAccountId)) bal.set(t.toAccountId, bal.get(t.toAccountId)! + t.amount)
    } else if (bal.has(from)) {
      bal.set(from, bal.get(from)! + (t.type === 'income' ? t.amount : -t.amount))
    }
  }
  return bal
}

/** Sum of balances over non-archived accounts. */
export function totalCashBalance(accounts: Account[], txs: Transaction[], asOf?: string): number {
  const bal = computeBalances(accounts, txs, asOf)
  return accounts.reduce((s, a) => (a.archived ? s : s + (bal.get(a.id) ?? 0)), 0)
}

/** Live accounts (non-archived first, then kind, then name) with current balances and total. */
export function useAccountBalances(): { accounts: Account[]; balances: Map<string, number>; total: number } {
  const rawAccounts = useTable('accounts')
  const txs = useTable('transactions')
  return useMemo(() => {
    const accounts = [...rawAccounts].sort(
      (a, b) =>
        Number(a.archived) - Number(b.archived) ||
        KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
        a.name.localeCompare(b.name, 'vi'),
    )
    const balances = computeBalances(accounts, txs)
    const total = accounts.reduce((s, a) => (a.archived ? s : s + (balances.get(a.id) ?? 0)), 0)
    return { accounts, balances, total }
  }, [rawAccounts, txs])
}
