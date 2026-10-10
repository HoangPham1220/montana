import { useState } from 'react'
import { ACCOUNT_KIND_LABEL, saveTransaction } from '../../lib/accounts'
import { DEFAULT_ACCOUNT_ID } from '../../lib/defaults'
import { today } from '../../lib/format'
import { remove, upsert, useTable } from '../../lib/store'
import type { Account, AccountKind } from '../../lib/types'
import { Button, Field, Input, Modal, MoneyInput, Select } from '../ui'

const ICON_SUGGESTIONS = ['💵', '🏦', '📱', '💳', '🐷', '💰', '🪙', '👛']
const COLOR_SWATCHES = ['#16a34a', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#ef4444', '#f97316', '#eab308', '#64748b']
const KINDS = Object.keys(ACCOUNT_KIND_LABEL) as AccountKind[]
const KIND_ICON: Record<AccountKind, string> = { cash: '💵', bank: '🏦', ewallet: '📱', credit: '💳' }

interface Props {
  open: boolean
  editing: Account | null
  onClose: () => void
}

export default function AccountForm({ open, ...rest }: Props) {
  return (
    <Modal open={open} title={rest.editing ? 'Sửa nguồn tiền' : 'Thêm nguồn tiền'} onClose={rest.onClose}>
      <Body {...rest} />
    </Modal>
  )
}

function Body({ editing, onClose }: Omit<Props, 'open'>) {
  const txs = useTable('transactions')
  const [name, setName] = useState(editing?.name ?? '')
  const [kind, setKind] = useState<AccountKind>(editing?.kind ?? 'bank')
  const [icon, setIcon] = useState(editing?.icon ?? KIND_ICON.bank)
  const [color, setColor] = useState(editing?.color ?? COLOR_SWATCHES[0])
  const [opening, setOpening] = useState(Math.abs(editing?.openingBalance ?? 0))
  const [currentBalance, setCurrentBalance] = useState(editing?.currentBalance ?? editing?.openingBalance ?? 0)
  const [debt, setDebt] = useState((editing?.openingBalance ?? 0) < 0)
  const [archived, setArchived] = useState(editing?.archived ?? false)
  const [iconTouched, setIconTouched] = useState(!!editing)
  const [error, setError] = useState('')

  const count = editing ? txs.filter((t) => t.accountId === editing.id || t.toAccountId === editing.id || (editing.id === DEFAULT_ACCOUNT_ID && !t.accountId)).length : 0
  const isDefault = editing?.id === DEFAULT_ACCOUNT_ID

  const changeKind = (k: AccountKind) => {
    setKind(k)
    if (!iconTouched) setIcon(KIND_ICON[k])
    if (k === 'credit') setDebt(true)
  }

  const save = () => {
    if (!name.trim()) return setError('Nhập tên nguồn tiền')
    const openingBalance = debt ? -opening : opening
    const currentBeforeAdjustment = editing
      ? (editing.currentBalance ?? editing.openingBalance) + openingBalance - editing.openingBalance
      : openingBalance
    upsert('accounts', {
      id: editing?.id,
      name: name.trim(),
      kind,
      icon: icon.trim() || KIND_ICON[kind],
      color,
      openingBalance,
      currentBalance: currentBeforeAdjustment,
      archived,
    })
    const difference = currentBalance - currentBeforeAdjustment
    if (editing && difference !== 0) {
      saveTransaction({
        type: 'adjustment',
        amount: difference,
        categoryId: '',
        accountId: editing.id,
        toAccountId: '',
        date: today(),
        note: `Thay đổi số dư - ${name.trim()}`,
      })
    }
    onClose()
  }

  const del = () => {
    if (!editing) return
    if (isDefault) return setError('Không thể xoá nguồn tiền mặc định, chỉ có thể đổi tên hoặc lưu trữ.')
    if (count > 0) return setError(`Nguồn tiền này có ${count} giao dịch nên không thể xoá. Hãy dùng "Lưu trữ" để ẩn nó.`)
    if (window.confirm(`Xoá "${editing.name}"?`)) {
      remove('accounts', editing.id)
      onClose()
    }
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <Field label="Tên">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Vietcombank, Momo…" autoFocus />
      </Field>
      <Field label="Loại">
        <Select value={kind} onChange={(e) => changeKind(e.target.value as AccountKind)}>
          {KINDS.map((k) => (
            <option key={k} value={k}>{ACCOUNT_KIND_LABEL[k]}</option>
          ))}
        </Select>
      </Field>
      <Field label="Biểu tượng">
        <Input value={icon} onChange={(e) => { setIcon(e.target.value); setIconTouched(true) }} maxLength={4} />
      </Field>
      <div className="flex flex-wrap gap-1">
        {ICON_SUGGESTIONS.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setIcon(i); setIconTouched(true) }}
            className={`h-9 w-9 rounded-lg border text-lg ${icon === i ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' : 'border-slate-200 dark:border-slate-700'}`}
          >
            {i}
          </button>
        ))}
      </div>
      <Field label="Màu">
        <div className="flex flex-wrap items-center gap-2">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-slate-300 bg-transparent dark:border-slate-700" />
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setColor(c)}
              style={{ background: c }}
              className={`h-7 w-7 rounded-full ${color === c ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
            />
          ))}
        </div>
      </Field>
      <Field label="Số dư ban đầu">
        <MoneyInput value={opening} onChange={setOpening} placeholder="0" />
      </Field>
      {editing && <Field label="Số dư hiện tại">
        <MoneyInput value={currentBalance} onChange={setCurrentBalance} placeholder="0" />
      </Field>}
      {kind === 'credit' && <p className="text-xs text-slate-500">Nhập số âm nếu đang nợ, ví dụ -5tr (hoặc bật &quot;Đang nợ&quot; và nhập 5tr).</p>}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={debt} onChange={(e) => setDebt(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
        Đang nợ (số dư ban đầu âm)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
        Lưu trữ — ẩn khỏi danh sách chọn
      </label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        {editing && !isDefault && (
          <Button type="button" variant="danger" onClick={del}>Xoá</Button>
        )}
        <Button type="button" variant="secondary" className="ml-auto" onClick={onClose}>Huỷ</Button>
        <Button type="submit">Lưu</Button>
      </div>
    </form>
  )
}
