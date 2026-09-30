import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, EmptyState } from '../ui'
import { formatPercent, formatVND } from '../../lib/format'

export interface Slice { id: string; name: string; color: string; value: number; target: number }

export default function AllocationCard({ slices, total }: { slices: Slice[]; total: number }) {
  const data = slices.filter((s) => s.value > 0)
  const hasTarget = slices.some((s) => s.target > 0)
  const targetSum = slices.reduce((n, s) => n + s.target, 0)
  return (
    <Card title="Phân bổ tài sản">
      {data.length === 0 ? (
        <EmptyState>Chưa có dữ liệu</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie isAnimationActive={false} data={data} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="90%" paddingAngle={2} stroke="none">
                  {data.map((s) => <Cell key={s.id} fill={s.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatVND(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2 self-center text-sm">
            {data.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <span className="text-right">
                  <span className="font-medium">{formatVND(s.value)}</span>
                  <span className="ml-2 text-slate-400">{formatPercent(total ? (s.value / total) * 100 : 0)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasTarget && (
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Phân bổ thực tế vs mục tiêu</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  <th className="py-1 font-medium">Danh mục</th>
                  <th className="py-1 text-right font-medium">Thực tế</th>
                  <th className="py-1 text-right font-medium">Mục tiêu</th>
                  <th className="py-1 text-right font-medium">Lệch</th>
                  <th className="py-1 text-right font-medium">Gợi ý</th>
                </tr>
              </thead>
              <tbody>
                {slices.filter((s) => s.target > 0 || s.value > 0).map((s) => {
                  const actual = total ? (s.value / total) * 100 : 0
                  const dev = actual - s.target
                  const diff = (s.target / 100) * total - s.value // >0 add, <0 reduce
                  const ok = Math.abs(dev) < 0.5
                  return (
                    <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-1.5">
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                        {s.name}
                      </td>
                      <td className="py-1.5 text-right">{formatPercent(actual)}</td>
                      <td className="py-1.5 text-right">{s.target > 0 ? formatPercent(s.target, 0) : '—'}</td>
                      <td className={`py-1.5 text-right ${s.target > 0 && !ok ? (dev > 0 ? 'text-amber-600' : 'text-sky-600') : ''}`}>
                        {s.target > 0 ? `${dev > 0 ? '+' : ''}${formatPercent(dev)}` : '—'}
                      </td>
                      <td className="py-1.5 text-right text-xs">
                        {s.target <= 0 ? '—' : ok ? 'Đạt mục tiêu' : diff > 0 ? `Thêm ${formatVND(diff)}` : `Giảm ${formatVND(-diff)}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {Math.round(targetSum) !== 100 && (
            <p className="mt-2 text-xs text-amber-600">Tổng mục tiêu hiện là {formatPercent(targetSum)} (nên bằng 100%).</p>
          )}
        </div>
      )}
    </Card>
  )
}
