import { monthLabel, shiftMonth } from '../../lib/format'

// Month navigator. `value` is YYYY-MM.
export default function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const btn =
    'flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-[#252b20] hover:bg-[#e9eedc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#596d24] dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-[#edf1e7] p-1 dark:bg-slate-900">
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
