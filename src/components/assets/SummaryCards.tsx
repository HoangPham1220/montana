import { Card } from '../ui'
import { formatPercent, formatVND } from '../../lib/format'

export default function SummaryCards({ value, invested, cost }: { value: number; invested: number; cost: number }) {
  const pl = invested - cost
  const pct = cost > 0 ? (pl / cost) * 100 : 0
  const color = pl > 0 ? 'text-emerald-600 dark:text-emerald-400' : pl < 0 ? 'text-rose-600 dark:text-rose-400' : ''
  const sign = pl > 0 ? '+' : ''
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card title="Tổng tài sản">
        <p className="text-2xl font-bold">{formatVND(value)}</p>
        <p className="text-xs text-slate-400">Gồm cả Nguồn tiền</p>
      </Card>
      <Card title="Vốn đầu tư">
        <p className="text-2xl font-bold">{formatVND(cost)}</p>
      </Card>
      <Card title="Tỷ giá">
        <p className={`text-2xl font-bold ${color}`}>{sign}{formatVND(pl)}</p>
        <p className={`text-sm ${color}`}>{sign}{formatPercent(pct, 2)}</p>
      </Card>
    </div>
  )
}
