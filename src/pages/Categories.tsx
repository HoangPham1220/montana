import { useMemo, useState } from 'react'
import { useTable } from '../lib/store'
import { formatVND, monthOf, today } from '../lib/format'
import { categorySpend } from '../lib/categoryTree'
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
  const [newParentId, setNewParentId] = useState<string | undefined>()

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

  const open = (category: Category | null, type: TxType = 'expense', parentId?: string) => {
    setEditing(category)
    setNewType(type)
    setNewParentId(parentId)
    setFormOpen(true)
  }

  const section = (title: string, type: TxType, list: Category[]) => {
    const roots = list.filter((category) => !category.parentId || !list.some((item) => item.id === category.parentId))
    return (
      <Card
        title={title}
        action={<Button variant="secondary" className="!px-2.5 !py-1 text-xs" onClick={() => open(null, type)}>+ Thêm</Button>}
      >
        {roots.length === 0 ? (
          <EmptyState>Chưa có danh mục.</EmptyState>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {roots.map((category) => {
              const children = list.filter((item) => item.parentId === category.id)
              return (
                <li key={category.id} className="py-1">
                  <CategoryRow
                    category={category}
                    spent={categorySpend(category, list, spent)}
                    onEdit={() => open(category)}
                    onAddChild={() => open(null, type, category.id)}
                  />
                  {children.map((child) => (
                    <CategoryRow
                      key={child.id}
                      category={child}
                      spent={spent.get(child.id) ?? 0}
                      onEdit={() => open(child)}
                      nested
                    />
                  ))}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Danh mục</h1>
      {section('Danh mục chi', 'expense', expense)}
      {section('Danh mục thu', 'income', income)}
      <CategoryForm
        open={formOpen}
        editing={editing}
        defaultType={newType}
        defaultParentId={newParentId}
        categories={categories}
        txCount={editing ? (counts.get(editing.id) ?? 0) : 0}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}

function CategoryRow({
  category, spent, onEdit, onAddChild, nested = false,
}: {
  category: Category
  spent: number
  onEdit: () => void
  onAddChild?: () => void
  nested?: boolean
}) {
  const over = category.budget > 0 && spent > category.budget
  const pct = category.budget > 0 ? Math.min(100, (spent / category.budget) * 100) : 0
  return (
    <div className={`flex items-center gap-3 py-2.5 ${nested ? 'ml-9 border-l-2 border-slate-100 pl-3 dark:border-slate-800' : ''}`}>
      <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 items-center gap-3 text-left hover:opacity-80">
        <CategoryDot icon={category.icon} color={category.color} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="truncate">{category.name}</span>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
          </span>
          {category.budget > 0 ? (
            <>
              <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{formatVND(spent)} / {formatVND(category.budget)}</span>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <span className={`block h-full rounded-full ${over ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
              </span>
            </>
          ) : category.type === 'expense' ? (
            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{formatVND(spent)} tháng này · chưa đặt ngân sách</span>
          ) : null}
        </span>
        {over && <span className="shrink-0 text-xs font-semibold text-rose-600">Vượt {formatVND(spent - category.budget)}</span>}
      </button>
      {onAddChild && <Button variant="secondary" className="!px-2 !py-1 text-xs" onClick={onAddChild}>+ Mục con</Button>}
    </div>
  )
}
