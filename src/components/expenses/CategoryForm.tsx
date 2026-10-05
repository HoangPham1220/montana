import { useState } from 'react'
import { remove, upsert } from '../../lib/store'
import type { Category, TxType } from '../../lib/types'
import { Button, Field, Input, Modal, MoneyInput, Select } from '../ui'
import TypeToggle from './TypeToggle'

const EMOJIS = ['🍜', '☕', '🛒', '🚗', '🏠', '💡', '📱', '🎬', '👕', '💊', '📚', '✈️', '🎁', '💰', '💼', '📈']
const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b']

interface Props {
  open: boolean
  editing: Category | null
  defaultType?: TxType
  /** Number of live transactions using the category (for the delete warning). */
  txCount: number
  categories: Category[]
  defaultParentId?: string
  onClose: () => void
}

export default function CategoryForm({ open, ...rest }: Props) {
  return (
    <Modal open={open} title={rest.editing ? 'Sửa danh mục' : 'Thêm danh mục'} onClose={rest.onClose}>
      <Body {...rest} />
    </Modal>
  )
}

function Body({ editing, defaultType = 'expense', txCount, categories, defaultParentId, onClose }: Omit<Props, 'open'>) {
  const [name, setName] = useState(editing?.name ?? '')
  const [type, setType] = useState<TxType>(editing?.type ?? defaultType)
  const [icon, setIcon] = useState(editing?.icon ?? EMOJIS[0])
  const [color, setColor] = useState(editing?.color ?? COLORS[0])
  const [budget, setBudget] = useState(editing?.budget ?? 0)
  const [parentId, setParentId] = useState(editing?.parentId ?? defaultParentId ?? '')
  const [error, setError] = useState('')
  const children = editing ? categories.filter((category) => category.parentId === editing.id) : []
  const hasChildren = children.length > 0
  const parentOptions = categories.filter((category) =>
    category.type === type && !category.parentId && category.id !== editing?.id,
  )

  const save = () => {
    if (!name.trim()) return setError('Nhập tên danh mục')
    if (hasChildren && editing && type !== editing.type) return setError('Hãy chuyển các danh mục con trước khi đổi loại danh mục')
    if (parentId && !parentOptions.some((category) => category.id === parentId)) return setError('Danh mục cha không hợp lệ')
    if (hasChildren && parentId) return setError('Hãy chuyển các danh mục con lên cấp cao nhất trước')
    upsert('categories', {
      id: editing?.id,
      name: name.trim(),
      type,
      parentId,
      icon: icon.trim() || '📦',
      color,
      budget: type === 'expense' ? budget : 0,
    })
    onClose()
  }

  const del = () => {
    if (!editing) return
    const childMessage = children.length
      ? ` ${children.length} danh mục con sẽ được chuyển lên cấp cao nhất.`
      : ''
    const transactionMessage = txCount
      ? ` ${txCount} giao dịch đang dùng danh mục này và sẽ không còn danh mục.`
      : ''
    const msg = `Xoá danh mục "${editing.name}"?${childMessage}${transactionMessage}`
    if (window.confirm(msg)) {
      for (const child of children) upsert('categories', { ...child, parentId: '' })
      remove('categories', editing.id)
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
      <Field label="Loại">
        <TypeToggle value={type} onChange={setType} />
      </Field>
      <Field label="Tên">
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Ăn uống" />
      </Field>
      <Field label="Danh mục cha (tuỳ chọn)">
        <Select value={parentId} onChange={(e) => setParentId(e.target.value)} disabled={hasChildren}>
          <option value="">-- Danh mục cấp cao nhất --</option>
          {parentOptions.map((category) => (
            <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
          ))}
        </Select>
      </Field>
      {hasChildren && <p className="text-xs text-slate-500">Danh mục đang có mục con nên không thể chuyển thành danh mục con.</p>}
      <Field label="Biểu tượng (emoji)">
        <Input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={8} />
      </Field>
      <div className="flex flex-wrap gap-1">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setIcon(e)}
            className={`h-9 w-9 rounded-lg text-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${
              icon === e ? 'bg-emerald-100 ring-2 ring-emerald-500 dark:bg-emerald-900/40' : ''
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <Field label="Màu">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            className={`h-7 w-7 rounded-full ${color.toLowerCase() === c ? 'ring-2 ring-slate-900 ring-offset-2 dark:ring-white dark:ring-offset-slate-900' : ''}`}
          />
        ))}
      </div>
      {type === 'expense' && (
        <Field label="Ngân sách tháng (VND, 0 = không đặt)">
          <MoneyInput value={budget} onChange={setBudget} placeholder="VD: 3tr" />
        </Field>
      )}
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button type="submit">Lưu</Button>
        {editing && (
          <Button type="button" variant="danger" className="ml-auto" onClick={del}>
            Xoá
          </Button>
        )}
      </div>
    </form>
  )
}
