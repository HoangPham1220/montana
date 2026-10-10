import { useEffect, useState } from 'react'
import { Button, Field, Input, Modal, MoneyInput, Select } from '../ui'
import { remove } from '../../lib/store'
import type { Asset, AssetCategory } from '../../lib/types'
import { saveAsset, UNIT_SUGGESTIONS } from './utils'

/** `asset` = editing; null = creating. */
export default function AssetFormModal({
  open, asset, categories, onClose,
}: { open: boolean; asset: Asset | null; categories: AssetCategory[]; onClose: () => void }) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('')
  const [costBasis, setCostBasis] = useState(0)
  const [currentValue, setCurrentValue] = useState(0)
  const [price, setPrice] = useState(0)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return
    setName(asset?.name ?? '')
    setCategoryId(asset?.categoryId ?? categories[0]?.id ?? '')
    setQuantity(String(asset?.quantity ?? 1))
    setUnit(asset?.unit ?? '')
    setCostBasis(asset?.costBasis ?? 0)
    setCurrentValue(asset?.currentValue ?? 0)
    setPrice(asset?.currentPrice ?? 0)
    setNote(asset?.note ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asset])

  const qty = Number(quantity.replace(',', '.')) || 0

  useEffect(() => {
    if (price > 0) setCurrentValue(Math.round(price * qty))
  }, [price, qty])

  const onPrice = (p: number) => {
    setPrice(p)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    saveAsset({ ...(asset ?? {}), id: asset?.id, name: name.trim(), categoryId, quantity: qty, unit: unit.trim(), costBasis, currentPrice: price || undefined, currentValue, note: note.trim() })
    onClose()
  }

  const del = () => {
    if (asset && confirm(`Xoá tài sản "${asset.name}"? Lịch sử giá trị vẫn được giữ lại.`)) {
      remove('assets', asset.id)
      onClose()
    }
  }

  return (
    <Modal open={open} title={asset ? 'Sửa tài sản' : 'Thêm tài sản'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Tên tài sản">
          <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="VD: Vàng SJC, VNM..." />
        </Field>
        <Field label="Danh mục">
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {!categories.some((c) => c.id === categoryId) && <option value={categoryId}>Chưa phân loại</option>}
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <p className="-mt-1 text-xs text-slate-400">
          Nếu bạn đã nhập tài khoản ngân hàng như một tài sản, hãy chuyển sang Nguồn tiền để tránh tính trùng.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Số lượng">
            <Input type="number" step="any" min="0" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </Field>
          <Field label="Đơn vị">
            <Input list="asset-units" value={unit} onChange={(e) => setUnit(e.target.value)} />
            <datalist id="asset-units">{UNIT_SUGGESTIONS.map((u) => <option key={u} value={u} />)}</datalist>
          </Field>
        </div>
        <Field label="Vốn đã bỏ ra (VND)">
          <MoneyInput value={costBasis} onChange={setCostBasis} placeholder="0" />
        </Field>
        <Field label="Giá hiện tại / đơn vị (tuỳ chọn, tự tính giá trị = giá × số lượng)">
          <MoneyInput value={price} onChange={onPrice} placeholder="0" />
        </Field>
        <Field label="Giá trị hiện tại (VND)">
          <MoneyInput value={currentValue} onChange={setCurrentValue} placeholder="0" />
        </Field>
        <Field label="Ghi chú">
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex gap-2 pt-2">
          {asset && <Button type="button" variant="danger" onClick={del}>Xoá</Button>}
          <Button type="button" variant="secondary" className="ml-auto" onClick={onClose}>Huỷ</Button>
          <Button type="submit">Lưu</Button>
        </div>
      </form>
    </Modal>
  )
}
