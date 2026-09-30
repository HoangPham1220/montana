import type { TransactionType } from '../../lib/types'

/** Chi / Thu toggle; pass `allowTransfer` to add "Chuyển tiền" (transactions only). */
export default function TypeToggle<T extends TransactionType>({
  value,
  onChange,
  allowTransfer = false,
}: {
  value: T
  onChange: (t: T) => void
  allowTransfer?: boolean
}) {
  const opt = (t: TransactionType, label: string, active: string) => (
    <button
      type="button"
      onClick={() => onChange(t as T)}
      className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
        value === t ? active : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
      }`}
    >
      {label}
    </button>
  )
  return (
    <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
      {opt('expense', 'Chi', 'bg-rose-600 text-white shadow-sm')}
      {opt('income', 'Thu', 'bg-emerald-600 text-white shadow-sm')}
      {allowTransfer && opt('transfer', 'Chuyển tiền', 'bg-sky-600 text-white shadow-sm')}
    </div>
  )
}
