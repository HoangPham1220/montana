import { useState } from 'react'
import { sync, takeManualSnapshot, updateSettings, useStore } from '../../lib/store'
import { Button, Card, Field, Input, Select } from '../ui'

export function SnapshotSettings() {
  const settings = useStore((s) => s.settings)
  const [draft, setDraft] = useState<string | null>(null)
  const day = draft ?? String(settings.snapshotDay)
  const [message, setMessage] = useState('')
  const [modeDraft, setModeDraft] = useState<'auto' | 'manual' | null>(null)
  const mode = modeDraft ?? settings.snapshotMode
  const [busy, setBusy] = useState(false)

  return (
    <Card title="Chốt tài sản hằng tháng">
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault()
        const value = Number(day)
        if (mode === 'auto' && (!Number.isInteger(value) || value < 1 || value > 31)) return setMessage('Chọn ngày từ 1 đến 31.')
        updateSettings({ snapshotMode: mode, ...(mode === 'auto' ? { snapshotDay: value } : {}) })
        setDraft(null)
        setModeDraft(null)
        void sync()
        setMessage('Đã lưu trên máy. Chế độ có hiệu lực trên Google Sheet sau khi đồng bộ thành công.')
      }}>
        <Field label="Chế độ snapshot">
          <Select disabled={busy} value={mode} onChange={(e) => { setModeDraft(e.target.value as 'auto' | 'manual'); setMessage('') }}>
            <option value="auto">Tự động</option>
            <option value="manual">Thủ công</option>
          </Select>
        </Field>
        {mode === 'auto' ? <>
          <Field label="Ngày chụp mỗi tháng (giờ Việt Nam)">
            <Input type="number" min="1" max="31" step="1" required value={day} onChange={(e) => setDraft(e.target.value)} />
          </Field>
          <p className="text-sm text-slate-500">Chụp khoảng 06–07 giờ, lưu số liệu trên Sheet tại lúc chụp. Ngày vượt số ngày trong tháng được chuyển về ngày cuối tháng. Đổi lịch không sửa snapshot đã chốt.</p>
          <p className="text-sm text-slate-500">Để bật lịch: cập nhật và triển khai Code.gs mới, rồi chạy installSnapshotTrigger một lần trong Apps Script. Cập nhật định giá và đồng bộ trước ngày chụp. Lịch vẫn chạy khi app đóng; không tạo bù tháng đã bỏ lỡ.</p>
        </> : <p className="text-sm text-slate-500">Bấm Snapshot để lưu số liệu tại thời điểm chụp vào kỳ tháng hiện tại (giờ Việt Nam). App sẽ lưu chế độ thủ công và đồng bộ trước khi chụp. Mỗi tháng chỉ chốt một lần, không ghi đè snapshot đã có. Lịch tự động dừng khi chế độ thủ công đã đồng bộ lên Sheet.</p>}
        {!settings.apiUrl && <p className="text-sm text-amber-600">Cần kết nối Google Sheet để chụp snapshot.</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>Lưu cài đặt snapshot</Button>
          {mode === 'manual' && <Button type="button" disabled={busy || !settings.apiUrl} onClick={async () => {
            setBusy(true)
            setMessage('Đang đồng bộ và chụp snapshot…')
            try {
              updateSettings({ snapshotMode: 'manual' })
              setModeDraft(null)
              await takeManualSnapshot()
              setMessage('Đã chốt snapshot tháng này. Xem số liệu tại trang Báo cáo.')
            } catch (e) { setMessage((e as Error).message) }
            finally { setBusy(false) }
          }}>{busy ? 'Đang chụp…' : 'Snapshot'}</Button>}
        </div>
        {message && <p role="status" className="text-sm text-slate-500">{message}</p>}
      </form>
    </Card>
  )
}
