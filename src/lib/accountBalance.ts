import { DEFAULT_ACCOUNT_ID } from './defaults'
import type { Account, Transaction } from './types'

export function txAccountId(t: Transaction): string {
  return t.accountId || DEFAULT_ACCOUNT_ID
}

export function accountDelta(t: Transaction, accountId: string): number {
  if (t.type === 'income') return txAccountId(t) === accountId ? t.amount : 0
  if (t.type === 'expense') return txAccountId(t) === accountId ? -t.amount : 0
  if (t.type === 'adjustment') return txAccountId(t) === accountId ? t.amount : 0
  const from = txAccountId(t)
  const to = t.toAccountId
  if (from === to) return 0
  return (from === accountId ? -t.amount : 0) + (to === accountId ? t.amount : 0)
}

/** Calculates balances for legacy migration and historical dates. */
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
      bal.set(from, bal.get(from)! + (t.type === 'income' || t.type === 'adjustment' ? t.amount : -t.amount))
    }
  }
  return bal
}
