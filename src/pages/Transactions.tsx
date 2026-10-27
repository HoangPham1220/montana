import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DEFAULT_ACCOUNT_ID } from '../lib/defaults'
import { useTable } from '../lib/store'
import { categoryLabel } from '../lib/categoryTree'
import { accountDelta, isIncomeOrExpense, txAccountId, useAccountBalances } from '../lib/accounts'
import { formatDate, formatVND, monthOf, today } from '../lib/format'
import type { Transaction, TransactionType } from '../lib/types'
import { Input, Select } from '../components/ui'
import MonthPicker from '../components/expenses/MonthPicker'
import TransactionForm from '../components/expenses/TransactionForm'
import CategoryDot from '../components/expenses/CategoryDot'
import FloatingActionMenu from '../components/ui/FloatingActionMenu'


export default function Transactions() {
  const transactions = useTable('transactions')
  const categories = useTable('categories')
  const assets = useTable('assets')
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
  const [filtersOpen, setFiltersOpen] = useState(false)

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const assetById = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets])
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
    <div className="mx-auto max-w-4xl space-y-6 pb-20 text-[#252b20] dark:text-slate-100">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Thu chi</h1>
          <Link to="/categories" className="mt-1 inline-block text-sm font-medium text-[#52672b] hover:underline dark:text-lime-300">Danh mục</Link>
        </div>
        <button type="button" onClick={() => openNew()} className="hidden rounded-full bg-[#c6e848] px-5 py-3 text-sm font-semibold text-[#1e2a12] hover:bg-[#b8d83f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#596d24] sm:inline-flex">+ Thêm giao dịch</button>
      </div>

      <div className="flex justify-center sm:justify-start"><MonthPicker value={month} onChange={setMonth} /></div>

      <section className="rounded-2xl bg-gradient-to-br from-[#d9ef77] to-[#a6ddc2] p-5 text-[#24331c] sm:p-7 dark:from-[#66812c] dark:to-[#245d4e] dark:text-white">
        <p className="text-sm font-medium">Tổng kết tháng · {accountFilter ? accLabel(accountFilter) : 'Tất cả nguồn tiền'}</p>
        <p className="mt-5 text-sm font-medium">Chênh lệch thu − chi</p>
        <p className="mt-1 break-words text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">{summary.diff > 0 ? '+' : ''}{formatVND(summary.diff)}</p>
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#24331c]/20 pt-4 min-[400px]:grid-cols-2 dark:border-white/20">
          <Stat label="Tổng thu" value={formatVND(summary.income)} />
          <Stat label="Tổng chi" value={formatVND(summary.expense)} />
        </div>
      </section>

      <section className="space-y-3" aria-label="Lọc giao dịch">
        <div className="flex gap-1 overflow-x-auto rounded-full bg-[#e9eee3] p-1 dark:bg-slate-800">
          {([['all', 'Tất cả'], ['expense', 'Chi'], ['income', 'Thu'], ['transfer', 'Chuyển tiền']] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={typeFilter === value} onClick={() => { setTypeFilter(value); setCategoryFilter('') }} className={`min-h-11 flex-1 whitespace-nowrap rounded-full px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#596d24] ${typeFilter === value ? 'bg-[#c6e848] text-[#202b16]' : 'text-[#46523e] hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-700'}`}>{label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input className="min-w-0" type="search" aria-label="Tìm ghi chú" placeholder="Tìm ghi chú..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} className="shrink-0 rounded-full bg-[#e9eee3] px-4 text-sm font-semibold text-[#33432a] hover:bg-[#dce5d4] dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">Bộ lọc{(accountFilter || categoryFilter) ? ' •' : ''}</button>
        </div>
        {filtersOpen && <div className="grid gap-2 sm:grid-cols-2">
        <Select aria-label="Nguồn tiền" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
          <option value="">Tất cả nguồn tiền</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.icon} {a.name}
              {a.archived ? ' (đã lưu trữ)' : ''}
            </option>
          ))}
        </Select>
        <Select aria-label="Danh mục" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Mọi danh mục</option>
          {filterCats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {categoryLabel(c, categories)}
            </option>
          ))}
        </Select>
        </div>}
      </section>

      <h2 className="text-lg font-bold">Giao dịch</h2>

      {groups.length === 0 ? (
        <div className="rounded-2xl bg-white px-5 py-10 text-center dark:bg-slate-900">
          {inMonth.length === 0 ? <><p className="font-semibold">Chưa có giao dịch trong tháng này</p><button type="button" onClick={() => openNew()} className="mt-3 text-sm font-semibold text-[#52672b] underline dark:text-lime-300">Thêm giao dịch</button></> : <><p className="font-semibold">Không có giao dịch phù hợp</p><button type="button" onClick={() => { setTypeFilter('all'); setAccountFilter(''); setCategoryFilter(''); setSearch('') }} className="mt-3 text-sm font-semibold text-[#52672b] underline dark:text-lime-300">Xóa bộ lọc</button></>}
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.date}>
            <div className="flex items-center justify-between gap-3 px-1 pb-2 text-sm font-medium text-[#596455] dark:text-slate-400">
              <span>{formatDate(g.date)}</span>
              <span className={g.total < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                {g.total > 0 ? '+' : ''}
                {formatVND(g.total)}
              </span>
            </div>
            <ul className="space-y-2">
              {g.items.map((t) => {
                const c = catById.get(t.categoryId)
                const isTransfer = t.type === 'transfer'
                const isAdjustment = t.type === 'adjustment'
                const isInvestment = t.type === 'investment'
                const delta = accountFilter ? accountDelta(t, accountFilter) : 0
                let amountText: string
                let amountCls: string
                if (isTransfer && !accountFilter) {
                  amountText = formatVND(t.amount)
                  amountCls = 'text-sky-600 dark:text-sky-400'
                } else {
                  const v = isTransfer ? delta : isAdjustment ? t.amount : t.type === 'income' ? t.amount : -t.amount
                  amountText = (v > 0 ? '+' : v < 0 ? '-' : '') + formatVND(Math.abs(v))
                  amountCls = v < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  if (v === 0) amountCls = 'text-slate-500'
                }
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left hover:bg-[#f0f5e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#596d24] dark:bg-slate-900 dark:hover:bg-slate-800"
                    >
                      <CategoryDot icon={isTransfer ? '🔁' : isAdjustment ? '↕️' : (c?.icon ?? '❓')} color={isTransfer ? '#0ea5e9' : isAdjustment ? '#64748b' : (c?.color ?? '#94a3b8')} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {isTransfer ? `Chuyển tiền: ${accLabel(txAccountId(t))} → ${accLabel(t.toAccountId)}` : isAdjustment ? t.note || 'Điều chỉnh số dư' : isInvestment ? `Đầu tư: ${assetById.get(t.assetId ?? '')?.name ?? 'Tài sản'}` : categoryLabel(c, categories)}
                        </span>
                        {!isTransfer && <span className="block truncate text-xs text-slate-600 dark:text-slate-400">{accLabel(t.accountId)}</span>}
                        {t.note && !isAdjustment && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{t.note}</span>}
                      </span>
                      <span className={`max-w-[55%] break-words text-right text-sm font-semibold tabular-nums ${amountCls}`}>{amountText}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}

      <FloatingActionMenu
        label="Thêm giao dịch"
        buttonClassName="bg-[#c6e848] text-[#202b16] hover:bg-[#b8d83f]"
        actions={[
          { label: 'Thêm khoản chi', description: 'Ghi lại một khoản chi tiêu', icon: '↗', onSelect: () => openNew('expense') },
          { label: 'Thêm khoản thu', description: 'Ghi lại tiền lương, thưởng…', icon: '↙', onSelect: () => openNew('income') },
          { label: 'Chuyển tiền', description: 'Chuyển giữa các nguồn tiền', icon: '⇄', onSelect: () => openNew('transfer') },
{ label: 'Đầu tư', description: 'Đầu tư từ nguồn tiền vào tài sản', icon: '\u{1F4C8}', onSelect: () => openNew('investment') },
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-sm">{label}</p>
      <p className="mt-1 break-words text-base font-bold tabular-nums sm:text-lg">{value}</p>
    </div>
  )
}
