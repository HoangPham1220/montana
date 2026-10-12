import { useMemo } from 'react'
import { formatDate, formatNumber, formatVND } from '../../lib/format'
import { useTable } from '../../lib/store'
import type { Asset, Transaction } from '../../lib/types'
import { EmptyState, Modal } from '../ui'

export default function AssetTransactionsModal({ asset, transactions, onClose, onEdit }: {
  asset: Asset | null
  transactions: Transaction[]
  onClose: () => void
  onEdit: (transaction: Transaction) => void
}) {
  const accounts = useTable('accounts')
  const accountNames = useMemo(() => new Map(accounts.map((a) => [a.id, a.name])), [accounts])
  const rows = useMemo(
    () => transactions.filter((t) => !t.deleted && t.assetId === asset?.id).sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt)),
    [transactions, asset],
  )

  return (
    <Modal open={!!asset} title={asset ? `Giao dịch: ${asset.name}` : ''} onClose={onClose}>
      {rows.length === 0 ? <EmptyState>Tài sản này chưa có giao dịch đầu tư.</EmptyState> : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((t) => (
            <li key={t.id}>
              <button type="button" className="flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => onEdit(t)}>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{formatDate(t.date)} · {formatNumber(t.investmentQuantity ?? 0)} {asset?.unit}</span>
                  <span className="block truncate text-xs text-slate-500">{accountNames.get(t.accountId) ?? 'Nguồn tiền'}{t.investmentUnitPrice ? ` · ${formatNumber(t.investmentUnitPrice)} / ${asset?.unit}` : ''}{t.note ? ` · ${t.note}` : ''}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-rose-600 dark:text-rose-400">-{formatVND(t.amount)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
