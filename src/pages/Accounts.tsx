import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AccountCard from '../components/accounts/AccountCard'
import AccountForm from '../components/accounts/AccountForm'
import FloatingActionMenu from '../components/ui/FloatingActionMenu'
import TransactionForm from '../components/expenses/TransactionForm'
import { Button, Card, EmptyState } from '../components/ui'
import { ACCOUNT_KIND_LABEL, useAccountBalances } from '../lib/accounts'
import { formatVND } from '../lib/format'
import { useTable } from '../lib/store'
import type { Account, AccountKind } from '../lib/types'

const KINDS: AccountKind[] = ['cash', 'bank', 'ewallet', 'credit']

export default function Accounts() {
  const { accounts, balances, total } = useAccountBalances()
  const categories = useTable('categories')
  const navigate = useNavigate()
  const [form, setForm] = useState<{ editing: Account | null } | null>(null)
  const [transferFrom, setTransferFrom] = useState<string | null>(null)

  const active = accounts.filter((a) => !a.archived)
  const archived = accounts.filter((a) => a.archived)
  let assets = 0
  let debt = 0
  for (const a of active) {
    const b = balances.get(a.id) ?? 0
    if (b >= 0) assets += b
    else debt += b
  }

  const card = (a: Account) => (
    <AccountCard
      key={a.id}
      account={a}
      balance={balances.get(a.id) ?? 0}
      onTransfer={() => setTransferFrom(a.id)}
      onHistory={() => navigate(`/transactions?account=${a.id}`)}
      onEdit={() => setForm({ editing: a })}
    />
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Nguồn tiền</h1>
        <Button onClick={() => setForm({ editing: null })} className="hidden sm:inline-flex">+ Thêm nguồn tiền</Button>
      </div>
      <FloatingActionMenu
        label="Thêm nguồn tiền"
        actions={[{ label: 'Thêm nguồn tiền', description: 'Tiền mặt, ngân hàng, ví hoặc tín dụng', icon: '＋', onSelect: () => setForm({ editing: null }) }]}
      />

      <Card>
        <div className="text-xs text-slate-500">Tổng số dư</div>
        <div className={`text-2xl font-bold tabular-nums ${total < 0 ? 'text-rose-600' : ''}`}>{formatVND(total)}</div>
        {debt < 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Tài sản tiền</div>
              <div className="font-semibold tabular-nums text-emerald-600">{formatVND(assets)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Nợ thẻ tín dụng</div>
              <div className="font-semibold tabular-nums text-rose-600">{formatVND(debt)}</div>
            </div>
          </div>
        )}
      </Card>

      {active.length === 0 && <EmptyState>Chưa có nguồn tiền nào.</EmptyState>}
      {KINDS.map((k) => {
        const list = active.filter((a) => a.kind === k)
        if (!list.length) return null
        return (
          <section key={k} className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{ACCOUNT_KIND_LABEL[k]}</h2>
            <div className="grid gap-3 sm:grid-cols-2">{list.map(card)}</div>
          </section>
        )
      })}

      {archived.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-slate-500">Đã lưu trữ ({archived.length})</summary>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">{archived.map(card)}</div>
        </details>
      )}

      <Card className="text-sm text-slate-500 dark:text-slate-400">
        Số dư = số dư ban đầu + thu − chi ± chuyển tiền. Số dư các nguồn tiền được cộng vào nhóm &quot;Tiền mặt &amp; tài khoản&quot; ở trang Tài sản.
      </Card>

      {form && <AccountForm key={form.editing?.id ?? 'new'} open editing={form.editing} onClose={() => setForm(null)} />}
      {transferFrom && (
        <TransactionForm
          key={transferFrom}
          open
          editing={null}
          categories={categories}
          defaultType="transfer"
          defaultAccountId={transferFrom}
          onClose={() => setTransferFrom(null)}
        />
      )}
    </div>
  )
}
