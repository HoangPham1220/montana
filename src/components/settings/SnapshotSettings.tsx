import { useState } from 'react'
import { sync, updateSettings, useStore } from '../../lib/store'
import { Button, Card, Field, Input } from '../ui'

export function SnapshotSettings() {
  const settings = useStore((s) => s.settings)
  const [draft, setDraft] = useState<string | null>(null)
  const day = draft ?? String(settings.snapshotDay)
  const [message, setMessage] = useState('')

  return (
    <Card title="Chốt tài sản hằng tháng">
      <form className="space-y-3" onSubmit={(e) => {
        e.preventDefault()
        const value = Number(day)
        if (!Number.isInteger(value) || value < 1 || value > 31) return setMessage('Chọn ngày từ 1 đến 31.')
        updateSettings({ snapshotDay: value })
        setDraft(null)
        void sync()
        setMessage('Đã lưu trên máy. Lịch có hiệu lực trên Google Sheet sau khi đồng bộ thành công.')
      }}>
        <Field label="Ngày chụp mỗi tháng (giờ Việt Nam)">
          <Input type="number" min="1" max="31" step="1" required value={day} onChange={(e) => setDraft(e.target.value)} />
        </Field>
        <p className="text-sm text-slate-500">Chụp khoảng 06–07 giờ, lưu số liệu trên Sheet tại lúc chụp. Ngày vượt số ngày trong tháng được chuyển về ngày cuối tháng. Đổi lịch không sửa snapshot đã chốt.</p>
        <p className="text-sm text-slate-500">Để bật lịch: cập nhật và triển khai Code.gs mới, rồi chạy installSnapshotTrigger một lần trong Apps Script. Cập nhật định giá và đồng bộ trước ngày chụp. Lịch vẫn chạy khi app đóng; không tạo bù tháng đã bỏ lỡ.</p>
        {!settings.apiUrl && <p className="text-sm text-amber-600">Cần kết nối Google Sheet để chụp tự động.</p>}
        <Button type="submit">Lưu lịch snapshot</Button>
        {message && <p role="status" className="text-sm text-slate-500">{message}</p>}
      </form>
    </Card>
  )
}
