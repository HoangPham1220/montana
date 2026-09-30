import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatVND } from '../../lib/format'
import { formatCompact } from './compact'

export interface Slice {
  id: string
  name: string
  color: string
  value: number
}

export function SpendDonut({ data, total }: { data: Slice[]; total: number }) {
  return (
    <div className="relative h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie isAnimationActive={false} data={data} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="90%" paddingAngle={2} stroke="none">
            {data.map((s) => (
              <Cell key={s.id} fill={s.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatVND(Number(v))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-slate-500">Tổng chi</span>
        <span className="text-base font-semibold">{formatCompact(total)}</span>
      </div>
    </div>
  )
}

export interface MonthPoint {
  label: string
  income: number
  expense: number
}

export function IncomeExpenseBars({ data }: { data: MonthPoint[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.3} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip formatter={(v) => formatVND(Number(v))} cursor={{ fill: 'rgba(148,163,184,0.15)' }} />
          <Legend />
          <Bar isAnimationActive={false} dataKey="income" name="Thu" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar isAnimationActive={false} dataKey="expense" name="Chi" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
