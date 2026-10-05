// Shared UI primitives. Keep feature code on these so pages look consistent.
import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { formatNumber, parseMoney } from '../../lib/format'
import { useStore } from '../../lib/store'

export function Card({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
const variants: Record<Variant, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
  secondary: 'border border-slate-300 bg-white hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800',
}
export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}

const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ''}`} />
}

/** Money input: shows grouped digits, accepts shorthand like 50k, 1.5tr. */
export function MoneyInput({ value, onChange, ...rest }: { value: number; onChange: (n: number) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const storedMultiplier = useStore((s) => s.settings.moneyInputMultiplier)
  const currencyCode = useStore((s) => s.settings.moneyInputCurrencyCode)
  const multiplier = Number.isFinite(storedMultiplier) && storedMultiplier > 0 ? storedMultiplier : 1
  const inputValue = value / multiplier
  const [text, setText] = useState(inputValue ? formatNumber(inputValue) : '')
  useEffect(() => {
    setText((t) => (parseMoney(t) === inputValue ? t : inputValue ? formatNumber(inputValue) : ''))
  }, [inputValue])
  const suffix = multiplier === 1 ? '' : `${currencyCode} × ${formatNumber(multiplier)}`
  const placeholder = multiplier === 1 ? rest.placeholder : 'VD: 20'
  return (
    <span className="relative block">
      <input
        inputMode="decimal"
        {...rest}
        placeholder={placeholder}
        className={`${inputCls} ${suffix ? 'pr-28' : ''} ${rest.className ?? ''}`}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          onChange(Math.round(parseMoney(e.target.value) * multiplier))
        }}
        onBlur={() => setText(inputValue ? formatNumber(inputValue) : '')}
      />
      {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] text-slate-400">{suffix}</span>}
    </span>
  )
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-5 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-700" aria-label="Đóng">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-slate-400">{children}</p>
}
