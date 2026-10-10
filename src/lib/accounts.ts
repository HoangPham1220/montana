// Money accounts ("Nguồn tiền"): balance maths shared by all pages.
import { useMemo } from 'react'
import { useTable } from './store'
import type { Account, AccountKind, Transaction } from './types'
import { accountDelta, computeBalances } from './accountBalance'
import { getState, remove, upsert } from './store'

export { accountDelta, computeBalances, txAccountId } from './accountBalance'

/** Account balances count toward this asset category on the Assets page. */
export const ACCOUNTS_ASSET_CATEGORY_ID = 'acat-cash'

export const ACCOUNT_KIND_LABEL: Record<AccountKind, string> = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
  ewallet: 'Ví điện tử',
  credit: 'Thẻ tín dụng',
}

const KIND_ORDER: AccountKind[] = ['cash', 'bank', 'ewallet', 'credit']

/** True only for real income/expense rows; transfers and balance adjustments are excluded from reports. */
export function isIncomeOrExpense(t: Transaction): boolean {
  return t.type === 'income' || t.type === 'expense'
}

/** Sum of balances over non-archived accounts. */
export function totalCashBalance(accounts: Account[], txs: Transaction[], asOf?: string): number {
  const bal = computeBalances(accounts, txs, asOf)
  return accounts.reduce((s, a) => (a.archived ? s : s + (bal.get(a.id) ?? 0)), 0)
}

type TransactionDraft = Omit<Transaction, 'id' | 'updatedAt'> & { id?: string }

function changeCachedBalances(deltas: Map<string, number>) {
  const accounts = getState().tables.accounts
  for (const account of accounts) {
    const delta = deltas.get(account.id) ?? 0
    if (delta) upsert('accounts', { ...account, currentBalance: (account.currentBalance ?? account.openingBalance) + delta })
  }
}

/** Save a transaction and apply only its balance difference to affected accounts. */
export function saveTransaction(draft: TransactionDraft) {
  const previous = draft.id && getState().tables.transactions.find((t) => t.id === draft.id && !t.deleted)
  const deltas = new Map<string, number>()
  if (previous) for (const account of getState().tables.accounts) deltas.set(account.id, -accountDelta(previous, account.id))
  const next = { ...draft, id: draft.id ?? '', updatedAt: '' } as Transaction
  for (const account of getState().tables.accounts) deltas.set(account.id, (deltas.get(account.id) ?? 0) + accountDelta(next, account.id))
  const saved = upsert('transactions', draft)
  changeCachedBalances(deltas)
  return saved
}

export function deleteTransaction(id: string) {
  const transaction = getState().tables.transactions.find((t) => t.id === id && !t.deleted)
  if (transaction) {
    const deltas = new Map(getState().tables.accounts.map((account) => [account.id, -accountDelta(transaction, account.id)]))
    changeCachedBalances(deltas)
  }
  remove('transactions', id)
}

/** Live accounts (non-archived first, then kind, then name) with current balances and total. */
export function useAccountBalances(): { accounts: Account[]; balances: Map<string, number>; total: number } {
  const rawAccounts = useTable('accounts')
  return useMemo(() => {
    const accounts = [...rawAccounts].sort(
      (a, b) =>
        Number(a.archived) - Number(b.archived) ||
        KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
        a.name.localeCompare(b.name, 'vi'),
    )
    const balances = new Map(accounts.map((a) => [a.id, a.currentBalance ?? a.openingBalance]))
    const total = accounts.reduce((s, a) => (a.archived ? s : s + (balances.get(a.id) ?? 0)), 0)
    return { accounts, balances, total }
  }, [rawAccounts])
}
