import { useRef, useState } from 'react'
import { Button, Card, Modal } from '../ui'
import { countRecords, exportJson, exportTransactionsCsv, importTables, parseBackup } from './dataIO'
import type { Tables } from '../../lib/types'

const STORAGE_KEY = 'montana:v1'

export function DataTools() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ name: string; tables: Partial<Tables> } | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [wipe, setWipe] = useState(false)

  const onFile = async (file?: File) => {
    if (!file) return
    setMsg(null)
    try {
      setPending({ name: file.name, tables: parseBackup(await file.text()) })
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const confirmImport = () => {
    if (!pending) return
    const n = importTables(pending.tables)
    setPending(null)
    setMsg({ ok: true, text: `Đã nhập ${n} bản ghi.` })
  }

  return (
    <>
      <Card title="Công cụ dữ liệu">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportJson}>Xuất JSON</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>Nhập JSON</Button>
          <Button variant="secondary" onClick={exportTransactionsCsv}>Xuất CSV giao dịch</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
        {msg && <p className={`mt-3 text-sm ${msg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{msg.text}</p>}
      </Card>

      <Card title="Vùng nguy hiểm" className="border-rose-200 dark:border-rose-900">
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
          Xoá toàn bộ dữ liệu lưu trên trình duyệt này. Dữ liệu trên Google Sheet vẫn được giữ và sẽ tải lại ở lần đồng bộ tiếp theo nếu bạn kết nối lại.
          Lưu ý: cài đặt kết nối cũng bị xoá, bạn cần nhập lại URL và token.
        </p>
        <Button variant="danger" onClick={() => setWipe(true)}>Xoá dữ liệu trên máy này</Button>
      </Card>

      <Modal open={!!pending} title="Nhập dữ liệu từ JSON" onClose={() => setPending(null)}>
        <p className="text-sm">
          File <b>{pending?.name}</b> có {pending ? countRecords(pending.tables) : 0} bản ghi. Bản ghi mới được thêm vào; bản ghi trùng id chỉ bị thay khi bản trong file không cũ hơn bản đang có trên máy.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPending(null)}>Huỷ</Button>
          <Button onClick={confirmImport}>Nhập</Button>
        </div>
      </Modal>

      <Modal open={wipe} title="Xoá dữ liệu trên máy này?" onClose={() => setWipe(false)}>
        <p className="text-sm">
          Thay đổi chưa đồng bộ sẽ mất vĩnh viễn, và bạn phải nhập lại URL + token. Hãy cân nhắc bấm Xuất JSON trước.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setWipe(false)}>Huỷ</Button>
          <Button
            variant="danger"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY)
              location.reload()
            }}
          >
            Xoá và tải lại
          </Button>
        </div>
      </Modal>
    </>
  )
}
