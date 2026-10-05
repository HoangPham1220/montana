import { useState } from 'react'

export interface FloatingAction {
  label: string
  description?: string
  icon: string
  onSelect: () => void
}

export default function FloatingActionMenu({ actions, label = 'Thêm' }: { actions: FloatingAction[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div className="sm:hidden">
      {open && <button type="button" aria-label="Đóng menu thêm" onClick={close} className="fixed inset-0 z-30 cursor-default bg-slate-950/10" />}
      {open && (
        <div className="fixed right-4 bottom-[calc(9.25rem+env(safe-area-inset-bottom))] z-40 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/20 dark:border-slate-700 dark:bg-slate-900">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => { close(); action.onSelect() }}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50 active:scale-[0.99] dark:hover:bg-slate-800"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{action.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{action.label}</span>
                {action.description && <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{action.description}</span>}
              </span>
              <span className="text-slate-300" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-3xl leading-none text-white shadow-lg shadow-emerald-900/25 transition hover:bg-emerald-700 active:scale-95 ${open ? 'rotate-45' : ''}`}
      >
        +
      </button>
    </div>
  )
}
