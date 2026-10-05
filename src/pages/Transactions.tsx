import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DEFAULT_ACCOUNT_ID } from '../lib/defaults'
import { useTable } from '../lib/store'
import { categoryLabel } from '../lib/categoryTree'
import { accountDelta, isIncomeOrExpense, txAccountId, useAccountBalances } from '../lib/accounts'
import { formatDate, formatVND, monthOf, today } from '../lib/format'
import type { Transaction, TransactionType } from '../lib/types'
import { Button, Card, EmptyState, Input, Select } from '../components/ui'
import MonthPicker from '../components/expenses/MonthPicker'
import TransactionForm from '../components/expenses/TransactionForm'
import CategoryDot from '../components/expenses/CategoryDot'
import FloatingActionMenu from '../components/ui/FloatingActionMenu'


export default function Transactions() {
  const transactions = useTable('transactions')
  const categories = useTable('categories')
  const [month, setMonth] = useState(monthOf(today()))
  const [searchParams] = useSearchParams()
  const { accounts } = useAccountBalances()
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [accountFilter, setAccountFilter] = useState(() => searchParams.get('account') ?? '')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [newType, setNewType] = useState<TransactionType>('expense')

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const accLabel = (id: string) => {
    const a = accById.get(id || DEFAULT_ACCOUNT_ID)
    return a ? `${a.icon} ${a.name}` : 'Không rõ'
  }

  const inMonth = useMemo(() => transactions.filter((t) => monthOf(t.date) === month), [transactions, month])

  const summary = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of inMonth) {
      if (!isIncomeOrExpense(t)) continue
      // With an account filter, totals cover only that account.
      if (accountFilter && txAccountId(t) !== accountFilter) continue
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    }
    return { income, expense, diff: income - expense }
  }, [inMonth, accountFilter])

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = inMonth
      .filter((t) => typeFilter === 'all' || t.type === typeFilter)
      .filter((t) => !accountFilter || txAccountId(t) === accountFilter || t.toAccountId === accountFilter)
      .filter((t) => !categoryFilter || t.categoryId === categoryFilter || catById.get(t.categoryId)?.parentId === categoryFilter)
      .filter((t) => !q || (t.note ?? '').toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt))
    const map = new Map<string, Transaction[]>()
    for (const t of filtered) map.set(t.date, [...(map.get(t.date) ?? []), t])
    const dayTotal = (t: Transaction) => {
      if (accountFilter) return accountDelta(t, accountFilter)
      return t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0
    }
    return Array.from(map, ([date, items]) => ({ date, items, total: items.reduce((s, t) => s + dayTotal(t), 0) }))
  }, [inMonth, typeFilter, accountFilter, categoryFilter, search, catById])

  const filterCats = useMemo(
    () => categories.filter((c) => typeFilter === 'all' || c.type === typeFilter),
    [categories, typeFilter],
  )

  const openNew = (type: TransactionType = 'expense') => {
    setEditing(null)
    setNewType(type)
    setFormOpen(true)
  }
  const openEdit = (t: Transaction) => {
    setEditing(t)
    setFormOpen(true)
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Thu chi</h1>
          <Link to="/categories" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
            Danh mục
          </Link>
        </div>
        <div className="flex items-center justify-center gap-3 sm:justify-end">
          <MonthPicker value={month} onChange={setMonth} />
          <Button onClick={() => openNew()} className="hidden sm:inline-flex">
            + Thêm
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Tổng thu" value={formatVND(summary.income)} cls="text-emerald-600 dark:text-emerald-400" />
        <Stat label="Tổng chi" value={formatVND(summary.expense)} cls="text-rose-600 dark:text-rose-400" />
        <Stat
          label="Chênh lệch"
          value={(summary.diff > 0 ? '+' : '') + formatVND(summary.diff)}
          cls={summary.diff < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as 'all' | TransactionType)
            setCategoryFilter('')
          }}
        >
          <option value="all">Tất cả</option>
          <option value="expense">Chi</option>
          <option value="income">Thu</option>
          <option value="transfer">Chuyển tiền</option>
        </Select>
        <Select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
          <option value="">Tất cả nguồn tiền</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.icon} {a.name}
              {a.archived ? ' (đã lưu trữ)' : ''}
            </option>
          ))}
        </Select>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Mọi danh mục</option>
          {filterCats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {categoryLabel(c, categories)}
            </option>
          ))}
        </Select>
        <Input
          className="col-span-2 sm:col-span-1"
          type="search"
          placeholder="Tìm ghi chú..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {groups.length === 0 ? (
        <Card>
          <EmptyState>Không có giao dịch nào trong {`tháng ${Number(month.slice(5))}/${month.slice(0, 4)}`}.</EmptyState>
        </Card>
      ) : (
        groups.map((g) => (
          <Card key={g.date} className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <span>{formatDate(g.date)}</span>
              <span className={g.total < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                {g.total > 0 ? '+' : ''}
                {formatVND(g.total)}
              </span>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {g.items.map((t) => {
                const c = catById.get(t.categoryId)
                const isTransfer = t.type === 'transfer'
                const delta = accountFilter ? accountDelta(t, accountFilter) : 0
                let amountText: string
                let amountCls: string
                if (isTransfer && !accountFilter) {
                  amountText = formatVND(t.amount)
                  amountCls = 'text-sky-600 dark:text-sky-400'
                } else {
                  const v = isTransfer ? delta : t.type === 'income' ? t.amount : -t.amount
                  amountText = (v > 0 ? '+' : v < 0 ? '-' : '') + formatVND(Math.abs(v))
                  amountCls = v < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  if (v === 0) amountCls = 'text-slate-500'
                }
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <CategoryDot icon={isTransfer ? '🔁' : (c?.icon ?? '❓')} color={isTransfer ? '#0ea5e9' : (c?.color ?? '#94a3b8')} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {isTransfer ? `Chuyển tiền: ${accLabel(txAccountId(t))} → ${accLabel(t.toAccountId)}` : categoryLabel(c, categories)}
                        </span>
                        {!isTransfer && <span className="block truncate text-xs text-slate-400">{accLabel(t.accountId)}</span>}
                        {t.note && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{t.note}</span>}
                      </span>
                      <span className={`shrink-0 text-sm font-semibold ${amountCls}`}>{amountText}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        ))
      )}

      <FloatingActionMenu
        label="Thêm giao dịch"
        actions={[
          { label: 'Thêm khoản chi', description: 'Ghi lại một khoản chi tiêu', icon: '↗', onSelect: () => openNew('expense') },
          { label: 'Thêm khoản thu', description: 'Ghi lại tiền lương, thưởng…', icon: '↙', onSelect: () => openNew('income') },
          { label: 'Chuyển tiền', description: 'Chuyển giữa các nguồn tiền', icon: '⇄', onSelect: () => openNew('transfer') },
        ]}
      />

      <TransactionForm
        open={formOpen}
        editing={editing}
        categories={categories}
        defaultType={newType}
        defaultDate={monthOf(today()) === month ? today() : `${month}-01`}
        defaultAccountId={accountFilter || undefined}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}

function Stat({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <Card className="!p-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 truncate text-sm font-bold sm:text-lg ${cls}`}>{value}</p>
    </Card>
  )
}
