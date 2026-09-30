import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState } from '../ui'
import { formatNumber, formatPercent, formatVND } from '../../lib/format'
import type { Asset } from '../../lib/types'

export interface GroupAccount { id: string; name: string; icon: string; balance: number }
export interface Group { id: string; name: string; color: string; assets: Asset[]; accounts?: GroupAccount[] }

const plClass = (n: number) => (n > 0 ? 'text-emerald-600 dark:text-emerald-400' : n < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400')

export default function AssetGroups({
  groups, total, onEdit, onQuickValue, onAdd, onManageCategories,
}: {
  groups: Group[]
  total: number
  onEdit: (a: Asset) => void
  onQuickValue: (a: Asset) => void
  onAdd: () => void
  onManageCategories: () => void
}) {
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  return (
    <Card
      title="Danh sách tài sản"
      action={
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onManageCategories}>Danh mục</Button>
          <Button onClick={onAdd}>+ Thêm</Button>
        </div>
      }
    >
      {groups.length === 0 && <EmptyState>Chưa có tài sản nào. Bấm "Thêm" để bắt đầu tích sản.</EmptyState>}
      <div className="space-y-3">
        {groups.map((g) => {
          const accs = g.accounts ?? []
          const sum = g.assets.reduce((n, a) => n + a.currentValue, 0) + accs.reduce((n, a) => n + a.balance, 0)
          const isClosed = closed[g.id]
          return (
            <div key={g.id} className="rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
                onClick={() => setClosed({ ...closed, [g.id]: !isClosed })}
                aria-expanded={!isClosed}
              >
                <span className="text-xs text-slate-400">{isClosed ? '▶' : '▼'}</span>
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: g.color }} />
                <span className="min-w-0 flex-1 truncate font-medium">{g.name} <span className="text-xs font-normal text-slate-400">({g.assets.length + accs.length})</span></span>
                <span className="text-right text-sm">
                  <span className="font-semibold">{formatVND(sum)}</span>
                  <span className="ml-2 text-slate-400">{formatPercent(total ? (sum / total) * 100 : 0)}</span>
                </span>
              </button>
              {!isClosed && (
                <>
                {accs.length > 0 && (
                  <p className="border-t border-slate-100 px-3 py-1.5 text-xs text-slate-400 dark:border-slate-800">
                    Nếu bạn đã nhập tài khoản ngân hàng như một tài sản, hãy chuyển sang Nguồn tiền để tránh tính trùng.
                  </p>
                )}
                <ul className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                  {g.assets.map((a) => {
                    const pl = a.currentValue - a.costBasis
                    const pct = a.costBasis > 0 ? (pl / a.costBasis) * 100 : 0
                    return (
                      <li key={a.id} className="flex items-center gap-2 px-3 py-2">
                        <button className="min-w-0 flex-1 text-left" onClick={() => onEdit(a)}>
                          <p className="truncate text-sm font-medium">{a.name}</p>
                          <p className="text-xs text-slate-400">
                            {formatNumber(a.quantity)} {a.unit} · Vốn {formatVND(a.costBasis)}
                          </p>
                        </button>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatVND(a.currentValue)}</p>
                          <p className={`text-xs ${plClass(pl)}`}>
                            {a.costBasis > 0 ? `${pl > 0 ? '+' : ''}${formatPercent(pct)}` : '—'}
                          </p>
                        </div>
                        <Button variant="ghost" className="!px-2 !py-1 text-xs" title="Cập nhật giá trị" onClick={() => onQuickValue(a)}>
                          Cập nhật
                        </Button>
                      </li>
                    )
                  })}
                  {accs.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 px-3 py-2">
                      <span className="text-lg">{a.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {a.name}
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-normal text-slate-500 dark:bg-slate-800 dark:text-slate-400">Nguồn tiền</span>
                        </p>
                      </div>
                      <p className={`text-sm font-semibold ${a.balance < 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}>{formatVND(a.balance)}</p>
                      <Link to="/accounts" className="px-2 text-xs text-emerald-600 hover:underline">Quản lý</Link>
                    </li>
                  ))}
                </ul>
                </>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
