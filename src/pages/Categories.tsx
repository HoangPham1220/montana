import { useMemo, useState } from 'react'
import { useTable } from '../lib/store'
import { formatVND, monthOf, today } from '../lib/format'
import type { Category, TxType } from '../lib/types'
import { Button, Card, EmptyState } from '../components/ui'
import CategoryForm from '../components/expenses/CategoryForm'
import CategoryDot from '../components/expenses/CategoryDot'

export default function Categories() {
  const categories = useTable('categories')
  const transactions = useTable('transactions')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [newType, setNewType] = useState<TxType>('expense')

  const { spent, counts } = useMemo(() => {
    const month = monthOf(today())
    const spent = new Map<string, number>()
    const counts = new Map<string, number>()
    for (const t of transactions) {
      counts.set(t.categoryId, (counts.get(t.categoryId) ?? 0) + 1)
      if (t.type === 'expense' && monthOf(t.date) === month) spent.set(t.categoryId, (spent.get(t.categoryId) ?? 0) + t.amount)
    }
    return { spent, counts }
  }, [transactions])

  const expense = useMemo(() => categories.filter((c) => c.type === 'expense'), [categories])
  const income = useMemo(() => categories.filter((c) => c.type === 'income'), [categories])

  const open = (c: Category | null, type: TxType = 'expense') => {
    setEditing(c)
    setNewType(type)
    setFormOpen(true)
  }

  const section = (title: string, type: TxType, list: Category[]) => (
    <Card
      title={title}
      action={
        <Button variant="secondary" className="!px-2.5 !py-1 text-xs" onClick={() => open(null, type)}>
          + Thêm
        </Button>
      }
    >
      {list.length === 0 ? (
        <EmptyState>Chưa có danh mục.</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {list.map((c) => {
            const s = spent.get(c.id) ?? 0
            const over = c.budget > 0 && s > c.budget
            const pct = c.budget > 0 ? Math.min(100, (s / c.budget) * 100) : 0
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => open(c)}
                  className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <CategoryDot icon={c.icon} color={c.color} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{c.name}</span>
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                    </span>
                    {type === 'expense' && (
                      <>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                          {c.budget > 0
                            ? `${formatVND(s)} / ${formatVND(c.budget)}`
                            : `${formatVND(s)} tháng này · chưa đặt ngân sách`}
                        </span>
                        {c.budget > 0 && (
                          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <span
                              className={`block h-full rounded-full ${over ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  {over && <span className="shrink-0 text-xs font-semibold text-rose-600">Vượt {formatVND(s - c.budget)}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Danh mục</h1>
      {section('Danh mục chi', 'expense', expense)}
      {section('Danh mục thu', 'income', income)}
      <CategoryForm
        open={formOpen}
        editing={editing}
        defaultType={newType}
        txCount={editing ? (counts.get(editing.id) ?? 0) : 0}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}
