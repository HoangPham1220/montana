import { ACCOUNT_KIND_LABEL } from '../../lib/accounts'
import { formatVND } from '../../lib/format'
import type { Account } from '../../lib/types'
import { Button } from '../ui'

interface Props {
  account: Account
  balance: number
  onTransfer: () => void
  onHistory: () => void
  onEdit: () => void
}

export default function AccountCard({ account, balance, onTransfer, onHistory, onEdit }: Props) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${account.archived ? 'opacity-70' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: `${account.color}22`, border: `1px solid ${account.color}` }}>
          {account.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{account.name}</div>
          <div className="text-xs text-slate-500">{ACCOUNT_KIND_LABEL[account.kind]}</div>
        </div>
      </div>
      <div className={`mt-3 text-xl font-semibold tabular-nums ${balance < 0 ? 'text-rose-600' : ''}`}>{formatVND(balance)}</div>
      <div className="text-xs text-slate-400">Số dư ban đầu: {formatVND(account.openingBalance)}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!account.archived && <Button variant="secondary" className="flex-1" onClick={onTransfer}>Chuyển tiền</Button>}
        <Button variant="secondary" className="flex-1" onClick={onHistory}>Lịch sử</Button>
        <Button variant="ghost" onClick={onEdit}>Sửa</Button>
      </div>
    </div>
  )
}
