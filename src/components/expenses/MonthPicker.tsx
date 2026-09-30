import { monthLabel, shiftMonth } from '../../lib/format'

// Month navigator. `value` is YYYY-MM.
export default function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const btn =
    'flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" className={btn} onClick={() => onChange(shiftMonth(value, -1))} aria-label="Tháng trước">
        ‹
      </button>
      <span className="min-w-[8rem] text-center text-sm font-semibold">{monthLabel(value)}</span>
      <button type="button" className={btn} onClick={() => onChange(shiftMonth(value, 1))} aria-label="Tháng sau">
        ›
      </button>
    </div>
  )
}
