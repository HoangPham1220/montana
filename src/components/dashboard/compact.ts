/** Compact VND for chart axes: 1,5tr / 200k / 2,3 tỷ. */
export function formatCompact(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  const fmt = (v: number) => v.toFixed(1).replace(/\.0$/, '').replace('.', ',')
  if (abs >= 1e9) return `${sign}${fmt(abs / 1e9)} tỷ`
  if (abs >= 1e6) return `${sign}${fmt(abs / 1e6)}tr`
  if (abs >= 1e3) return `${sign}${fmt(abs / 1e3)}k`
  return `${sign}${Math.round(abs)}`
}

export { currentMonth, monthLabel, shiftMonth } from '../../lib/format'
