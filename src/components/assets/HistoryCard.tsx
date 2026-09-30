import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '../ui'
import { formatDate, formatVND } from '../../lib/format'
import type { HistoryPoint } from './utils'

const short = (n: number) =>
  Math.abs(n) >= 1e9 ? `${+(n / 1e9).toFixed(2)} tỷ` : Math.abs(n) >= 1e6 ? `${+(n / 1e6).toFixed(1)} tr` : String(Math.round(n))

export default function HistoryCard({ points }: { points: HistoryPoint[] }) {
  if (points.length < 2) return null
  return (
    <Card title="Diễn biến tài sản ròng">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.25} />
            <XAxis dataKey="date" tickFormatter={(d: string) => formatDate(d).slice(0, 5)} tick={{ fontSize: 11 }} minTickGap={24} />
            <YAxis tickFormatter={short} tick={{ fontSize: 11 }} width={60} />
            <Tooltip formatter={(v) => formatVND(Number(v))} labelFormatter={(d) => formatDate(String(d))} />
            <Area isAnimationActive={false} type="monotone" dataKey="total" name="Tổng tài sản" stroke="#10b981" strokeWidth={2} fill="url(#nwFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
