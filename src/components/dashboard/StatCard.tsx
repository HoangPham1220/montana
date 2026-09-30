import type { ReactNode } from 'react'
import { Card } from '../ui'

export function StatCard({ label, value, hint, tone = 'default' }: { label: string; value: string; hint?: ReactNode; tone?: 'default' | 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-rose-600' : ''
  return (
    <Card>
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-1 truncate text-lg font-bold sm:text-xl ${color}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </Card>
  )
}
