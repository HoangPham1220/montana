import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState } from '../components/ui'
import { StatCard } from '../components/dashboard/StatCard'
import { IncomeExpenseBars, SpendDonut, type MonthPoint, type Slice } from '../components/dashboard/Charts'
import { currentMonth, monthLabel, shiftMonth } from '../components/dashboard/compact'
import { formatDate, formatPercent, formatVND, monthOf } from '../lib/format'
import { useTable } from '../lib/store'
import { useAccountBalances } from '../lib/accounts'
import { DEFAULT_ACCOUNT_ID } from '../lib/defaults'

export default function Dashboard() {
  const categories = useTable('categories')
  const transactions = useTable('transactions')
  const assets = useTable('assets')
  const { accounts, total: cashTotal } = useAccountBalances()
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts])
  const [month, setMonth] = useState(currentMonth)

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const { income, expense, slices, budgetRows, months } = useMemo(() => {
    const perMonth = new Map<string, { income: number; expense: number }>()
    const spendByCat = new Map<string, number>()
    let income = 0
    let expense = 0
    for (const t of transactions) {
      if (t.type === 'transfer') continue
      const m = monthOf(t.date)
      const p = perMonth.get(m) ?? { income: 0, expense: 0 }
      p[t.type] += t.amount
      perMonth.set(m, p)
      if (m === month) {
        if (t.type === 'income') income += t.amount
        else {
          expense += t.amount
          spendByCat.set(t.categoryId, (spendByCat.get(t.categoryId) ?? 0) + t.amount)
        }
      }
    }
    const slices: Slice[] = [...spendByCat.entries()]
      .map(([id, value]) => {
        const c = catById.get(id)
        return { id, value, name: c ? `${c.icon} ${c.name}`.trim() : 'Khác', color: c?.color ?? '#94a3b8' }
      })
      .sort((a, b) => b.value - a.value)
    const budgetRows = categories
      .filter((c) => c.type === 'expense' && c.budget > 0)
      .map((c) => ({ c, spent: spendByCat.get(c.id) ?? 0, ratio: (spendByCat.get(c.id) ?? 0) / c.budget }))
      .filter((r) => r.ratio >= 0.8)
      .sort((a, b) => b.ratio - a.ratio)
    const months: MonthPoint[] = Array.from({ length: 6 }, (_, i) => {
      const m = shiftMonth(month, i - 5)
      const p = perMonth.get(m) ?? { income: 0, expense: 0 }
      return { label: `T${Number(m.slice(5))}/${m.slice(2, 4)}`, ...p }
    })
    return { income, expense, slices, budgetRows, months }
  }, [transactions, categories, catById, month])

  const totalAssets = useMemo(() => assets.reduce((s, a) => s + a.currentValue, 0) + cashTotal, [assets, cashTotal])
  const recent = useMemo(
    () => [...transactions].sort((a, b) => (b.date + b.updatedAt).localeCompare(a.date + a.updatedAt)).slice(0, 5),
    [transactions],
  )

  const savings = income - expense
  const rate = income > 0 ? (savings / income) * 100 : 0

  if (transactions.length === 0 && assets.length === 0) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="text-5xl">👋</div>
        <h1 className="mt-3 text-xl font-bold">Chào mừng đến với Montana</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Chưa có dữ liệu nào. Hãy thêm giao dịch đầu tiên, hoặc kết nối Google Sheet để tải dữ liệu đã lưu về máy.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link to="/transactions"><Button>Thêm giao dịch đầu tiên</Button></Link>
          <Link to="/settings"><Button variant="secondary">Kết nối Google Sheet</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Tổng quan</h1>
        <div className="flex items-center gap-1">
          <Button variant="secondary" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Tháng trước">‹</Button>
          <button
            onClick={() => setMonth(currentMonth())}
            className="min-w-32 rounded-lg px-2 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Về tháng hiện tại"
          >
            {monthLabel(month)}
          </button>
          <Button variant="secondary" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Tháng sau">›</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Thu tháng này" value={formatVND(income)} tone="good" />
        <StatCard label="Chi tháng này" value={formatVND(expense)} tone="bad" />
        <StatCard
          label="Tiết kiệm"
          value={formatVND(savings)}
          tone={savings >= 0 ? 'good' : 'bad'}
          hint={income > 0 ? `Tỷ lệ tiết kiệm ${formatPercent(rate)}` : 'Chưa có thu nhập'}
        />
        <StatCard
          label="Tổng tài sản"
          value={formatVND(totalAssets)}
          hint={
            <span className="block">
              <Link to="/accounts" className="block hover:underline">Nguồn tiền: {formatVND(cashTotal)}</Link>
              <Link to="/assets" className="text-emerald-600 hover:underline">Xem tài sản →</Link>
            </span>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Chi theo danh mục">
          {slices.length === 0 ? (
            <EmptyState>Chưa có khoản chi nào trong tháng này.</EmptyState>
          ) : (
            <>
              <SpendDonut data={slices} total={expense} />
              <ul className="mt-3 space-y-1.5">
                {slices.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                    <span className="text-slate-500">{formatPercent((s.value / expense) * 100)}</span>
                    <span className="w-28 text-right font-medium">{formatVND(s.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card title="Thu và chi 6 tháng gần nhất">
          <IncomeExpenseBars data={months} />
        </Card>
      </div>

      {budgetRows.length > 0 && (
        <Card title="⚠️ Cảnh báo ngân sách">
          <ul className="space-y-3">
            {budgetRows.map(({ c, spent, ratio }) => {
              const over = ratio > 1
              return (
                <li key={c.id}>
                  <div className="mb-1 flex justify-between gap-2 text-sm">
                    <span className="truncate">{c.icon} {c.name}</span>
                    <span className={over ? 'font-medium text-rose-600' : 'text-amber-600'}>
                      {formatVND(spent)} / {formatVND(c.budget)} ({formatPercent(ratio * 100, 0)})
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className={`h-full rounded-full ${over ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Card title="Giao dịch gần đây" action={<Link to="/transactions" className="text-sm text-emerald-600 hover:underline">Xem tất cả</Link>}>
        {recent.length === 0 ? (
          <EmptyState>Chưa có giao dịch.</EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((t) => {
              const c = catById.get(t.categoryId)
              const transfer = t.type === 'transfer'
              const title = transfer
                ? `Chuyển tiền: ${accountById.get(t.accountId || DEFAULT_ACCOUNT_ID)?.name ?? 'Không rõ'} → ${accountById.get(t.toAccountId)?.name ?? 'Không rõ'}`
                : t.note || c?.name || 'Không rõ danh mục'
              return (
                <li key={t.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="text-xl">{transfer ? '🔁' : (c?.icon ?? '❔')}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{title}</div>
                    <div className="text-xs text-slate-500">{formatDate(t.date)}{transfer ? (t.note ? ` · ${t.note}` : '') : ` · ${c?.name ?? 'Khác'}`}</div>
                  </div>
                  <span className={`font-semibold ${transfer ? 'text-slate-500' : t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {transfer ? '' : t.type === 'income' ? '+' : '-'}{formatVND(t.amount)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
