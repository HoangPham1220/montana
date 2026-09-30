import { useEffect, useState } from 'react'
import { Button, Field, Modal, MoneyInput } from '../ui'
import { formatVND } from '../../lib/format'
import type { Asset } from '../../lib/types'
import { saveAsset } from './utils'

export default function QuickValueModal({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  const [value, setValue] = useState(0)
  useEffect(() => setValue(asset?.currentValue ?? 0), [asset])
  return (
    <Modal open={!!asset} title={asset ? `Cập nhật: ${asset.name}` : ''} onClose={onClose}>
      {asset && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            saveAsset({ ...asset, currentValue: value })
            onClose()
          }}
        >
          <p className="text-sm text-slate-500">Giá trị hiện tại: {formatVND(asset.currentValue)}</p>
          <Field label="Giá trị mới (VND)">
            <MoneyInput value={value} onChange={setValue} autoFocus />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Huỷ</Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
