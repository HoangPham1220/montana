import { useState } from 'react'
import { Button, Field, Input, Modal } from '../ui'
import { remove, upsert } from '../../lib/store'
import { formatPercent } from '../../lib/format'
import type { Asset, AssetCategory } from '../../lib/types'
import { SWATCHES } from './utils'

interface Draft { id?: string; name: string; color: string; targetPercent: string }
const blank = (): Draft => ({ name: '', color: SWATCHES[0], targetPercent: '' })

export default function CategoriesModal({
  open, categories, assets, onClose,
}: { open: boolean; categories: AssetCategory[]; assets: Asset[]; onClose: () => void }) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const targetSum = categories.reduce((n, c) => n + (c.targetPercent || 0), 0)
  const anyTarget = targetSum > 0

  const close = () => { setDraft(null); onClose() }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft || !draft.name.trim()) return
    const t = Math.min(100, Math.max(0, Number(draft.targetPercent.replace(',', '.')) || 0))
    upsert('assetCategories', { id: draft.id, name: draft.name.trim(), color: draft.color, targetPercent: t })
    setDraft(null)
  }

  const del = (c: AssetCategory) => {
    const n = assets.filter((a) => a.categoryId === c.id).length
    const msg = n > 0
      ? `Danh mục "${c.name}" còn ${n} tài sản. Xoá danh mục thì các tài sản này sẽ thành "Chưa phân loại". Vẫn xoá?`
      : `Xoá danh mục "${c.name}"?`
    if (confirm(msg)) remove('assetCategories', c.id)
  }

  return (
    <Modal open={open} title="Danh mục tài sản" onClose={close}>
      {anyTarget && Math.round(targetSum) !== 100 && (
        <p className="mb-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Tổng tỷ trọng mục tiêu là {formatPercent(targetSum)}, nên bằng 100%.
        </p>
      )}
      {draft ? (
        <form onSubmit={save} className="space-y-3">
          <Field label="Tên danh mục">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required autoFocus />
          </Field>
          <Field label="Màu">
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  type="button"
                  key={c}
                  aria-label={c}
                  onClick={() => setDraft({ ...draft, color: c })}
                  className={`h-7 w-7 rounded-full border-2 ${draft.color === c ? 'border-slate-900 dark:border-white' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
              <input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} className="h-7 w-9 cursor-pointer rounded" />
            </div>
          </Field>
          <Field label="Tỷ trọng mục tiêu (%, 0 = không đặt)">
            <Input type="number" min="0" max="100" step="any" inputMode="decimal" value={draft.targetPercent} onChange={(e) => setDraft({ ...draft, targetPercent: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDraft(null)}>Huỷ</Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2">
                <span className="h-4 w-4 shrink-0 rounded-full" style={{ background: c.color }} />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {c.name}
                  <span className="ml-2 text-xs text-slate-400">{c.targetPercent > 0 ? `mục tiêu ${formatPercent(c.targetPercent, 0)}` : ''}</span>
                </span>
                <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => setDraft({ id: c.id, name: c.name, color: c.color, targetPercent: c.targetPercent ? String(c.targetPercent) : '' })}>Sửa</Button>
                <Button variant="ghost" className="!px-2 !py-1 text-xs text-rose-600" onClick={() => del(c)}>Xoá</Button>
              </li>
            ))}
          </ul>
          <Button className="w-full" onClick={() => setDraft(blank())}>+ Thêm danh mục</Button>
        </div>
      )}
    </Modal>
  )
}
