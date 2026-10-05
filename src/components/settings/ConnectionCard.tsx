import { useEffect, useState } from 'react'
import { Button, Card, Field, Input } from '../ui'
import { pendingCount, sync, testConnection, updateSettings, useStore } from '../../lib/store'

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa đồng bộ lần nào'

export function ConnectionCard() {
  const settings = useStore((s) => s.settings)
  const syncState = useStore((s) => s.sync)
  const pending = useStore(pendingCount)
  const [url, setUrl] = useState(settings.apiUrl)
  const [token, setToken] = useState(settings.token)
  const [auto, setAuto] = useState(settings.autoSync)
  const [show, setShow] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => setAuto(settings.autoSync), [settings.autoSync])

  const dirty = url !== settings.apiUrl || token !== settings.token || auto !== settings.autoSync
  const save = () => {
    updateSettings({ apiUrl: url.trim(), token: token.trim(), autoSync: auto })
    setMsg({ ok: true, text: 'Đã lưu cài đặt.' })
  }

  const test = async () => {
    // testConnection reads the saved settings, so save first.
    updateSettings({ apiUrl: url.trim(), token: token.trim(), autoSync: auto })
    setTesting(true)
    setMsg(null)
    try {
      const t = await testConnection()
      setMsg({ ok: true, text: `Kết nối thành công (giờ máy chủ: ${fmtTime(t)}).` })
    } catch (e) {
      setMsg({ ok: false, text: `Kết nối thất bại: ${(e as Error).message}` })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card title="Kết nối Google Sheet">
      <div className="space-y-3">
        <Field label="Web App URL">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" autoComplete="off" />
        </Field>
        <Field label="Token">
          <div className="flex gap-2">
            <Input type={show ? 'text' : 'password'} value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" />
            <Button type="button" variant="secondary" onClick={() => setShow((v) => !v)}>{show ? 'Ẩn' : 'Hiện'}</Button>
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
          Tự động đồng bộ
        </label>
        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={!dirty}>Lưu</Button>
          <Button variant="secondary" onClick={() => void test()} disabled={!url.trim() || testing}>
            {testing ? 'Đang kiểm tra…' : 'Kiểm tra kết nối'}
          </Button>
          <Button variant="secondary" onClick={() => void sync()} disabled={!settings.apiUrl || syncState.status === 'syncing'}>
            {syncState.status === 'syncing' ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
          </Button>
        </div>
        {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{msg.text}</p>}

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
          <dt className="text-slate-500">Trạng thái</dt>
          <dd className={syncState.status === 'error' ? 'text-rose-600' : ''}>
            {syncState.status === 'syncing' ? 'Đang đồng bộ…' : syncState.status === 'error' ? `Lỗi: ${syncState.error}` : 'Sẵn sàng'}
          </dd>
          <dt className="text-slate-500">Lần cuối</dt>
          <dd>{fmtTime(syncState.lastSyncAt)}</dd>
          <dt className="text-slate-500">Chờ đẩy lên</dt>
          <dd>{pending} thay đổi</dd>
        </dl>

        <div className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
          <div className="mb-1 font-medium">Hướng dẫn nhanh</div>
          <ol className="list-decimal space-y-0.5 pl-5 text-slate-600 dark:text-slate-400">
            <li>Tạo một Google Sheet trống.</li>
            <li>Vào Tiện ích mở rộng → Apps Script, dán mã backend từ thư mục dự án.</li>
            <li>Đặt token bí mật trong Script Properties.</li>
            <li>Triển khai dạng Web App (chạy bằng tài khoản của bạn, ai có link cũng truy cập được).</li>
            <li>Dán URL và token vào đây, bấm Kiểm tra kết nối.</li>
          </ol>
          <p className="mt-2 text-xs text-slate-500">URL và token cần nhập một lần trên từng thiết bị. Sau đó bấm Đồng bộ ngay để tải các tuỳ chọn dùng chung từ tab appSettings.</p>
          <p className="mt-2 text-xs text-slate-500">Chi tiết từng bước xem trong README của dự án.</p>
        </div>
      </div>
    </Card>
  )
}
