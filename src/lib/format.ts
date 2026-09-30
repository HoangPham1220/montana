const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const num = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 8 })

export const formatVND = (n: number) => vnd.format(Math.round(n || 0))
export const formatNumber = (n: number) => num.format(n || 0)
export const formatPercent = (n: number, digits = 1) => `${(n || 0).toFixed(digits)}%`

/** Parse user-typed money like "1.500.000" or "1,5tr" / "200k". */
export function parseMoney(input: string): number {
  const s = input.trim().toLowerCase().replace(/\s/g, '')
  const m = s.match(/^([\d.,]+)(k|tr|m|ty|tỷ)?$/)
  if (!m) return Number(s.replace(/[^\d-]/g, '')) || 0
  const mult = { k: 1e3, tr: 1e6, m: 1e6, ty: 1e9, 'tỷ': 1e9 }[m[2] as 'k'] ?? 1
  // "1.500.000" / "1.500k": separators followed by 3-digit groups are thousands
  // separators; otherwise ("1,5tr", "1.5") the single separator is a decimal point.
  const grouped = /^\d{1,3}([.,]\d{3})+$/.test(m[1])
  const raw = grouped ? m[1].replace(/[.,]/g, '') : m[1].replace(',', '.')
  return Math.round(parseFloat(raw) * mult) || 0
}

/** Local date as YYYY-MM-DD. */
export const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** YYYY-MM of a YYYY-MM-DD string. */
export const monthOf = (date: string) => date.slice(0, 7)

export const formatDate = (date: string) => {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

/** Current local month as YYYY-MM. */
export const currentMonth = () => today().slice(0, 7)

/** Move a YYYY-MM month by delta months. */
export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** "Tháng 9/2026" */
export const monthLabel = (ym: string) => `Tháng ${Number(ym.slice(5))}/${ym.slice(0, 4)}`
