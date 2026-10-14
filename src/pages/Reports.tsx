import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, EmptyState, Field, Input, Select } from '../components/ui'
import { currentMonth, formatDate, formatNumber, formatVND, shiftMonth } from '../lib/format'
import { parseSnapshot, snapshotTotals, type SnapshotData } from '../lib/financialReports'
import { useTable } from '../lib/store'
import { csvCell, download } from '../components/settings/dataIO'

const capturedTime = (iso: string) => new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

export default function Reports() {
  const snapshots = useTable('financialSnapshots')
  const [month, setMonth] = useState(currentMonth)
  const [months, setMonths] = useState(1)
  const snapshot = snapshots.find((s) => s.month === month)
  const previousMonth = shiftMonth(month, -months)
  const previous = snapshots.find((s) => s.month === previousMonth)
  let report: { data: SnapshotData; totals: ReturnType<typeof snapshotTotals>; before?: ReturnType<typeof snapshotTotals> } | undefined
  let error = ''
  try {
    if (snapshot) {
      const data = parseSnapshot(snapshot)
      const before = previous ? parseSnapshot(previous) : undefined
      report = { data, totals: snapshotTotals(data), before: before ? snapshotTotals(before) : undefined }
    }
  } catch (e) { error = (e as Error).message }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Báo cáo tài sản</h1>
      <p className="text-sm text-slate-500">Số liệu đã chốt tại ngày chụp, gồm cả nguồn tiền đã lưu trữ. Tháng, quý và năm so sánh với snapshot cách 1, 3 và 12 tháng; không phải số liệu cuối kỳ dương lịch.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Chu kỳ so sánh"><Select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          <option value="1">Tháng (1 tháng)</option><option value="3">Quý (3 tháng)</option><option value="12">Năm (12 tháng)</option>
        </Select></Field>
        <Field label="Tháng snapshot cuối kỳ"><Input type="month" value={month} onChange={(e) => { if (e.target.value) setMonth(e.target.value) }} /></Field>
      </div>
      <p className="text-sm text-slate-500">Các kỳ đã có: {snapshots.length ? [...snapshots].sort((a, b) => b.month.localeCompare(a.month)).map((s) => (
        <button key={s.id} className="mr-3 text-emerald-600 underline" onClick={() => setMonth(s.month)}>{s.month}</button>
      )) : 'Chưa có snapshot.'} <Link className="text-emerald-600 underline" to="/settings">Cài đặt lịch</Link></p>
      {error && <p role="alert" className="text-rose-600">{error}</p>}
      {!snapshot && <Card><EmptyState>Chưa có snapshot tháng {month}. Đồng bộ để tải số đã chốt từ Google Sheet. App không dựng lại snapshot từ dữ liệu hiện tại.</EmptyState></Card>}
      {snapshot && report && <>
        <Card title={`Snapshot ${formatDate(snapshot.scheduledDate)}`} action={<Button variant="secondary" onClick={() => {
          const rows: (string | number)[][] = [['Tháng', 'Ngày chụp', 'Loại', 'Tên', 'Danh mục', 'Số lượng', 'Đơn vị', 'Giá vốn', 'Giá trị']]
          for (const a of report.data.accounts) rows.push([month, snapshot.capturedAt, 'Nguồn tiền', a.name, a.kind, '', '', '', a.currentBalance])
          for (const a of report.data.assets) rows.push([month, snapshot.capturedAt, 'Tài sản', a.name, report.data.assetCategories.find((c) => c.id === a.categoryId)?.name ?? 'Chưa phân loại', a.quantity, a.unit, a.costBasis, a.currentValue])
          download(`montana-tai-san-${month}.csv`, '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8')
        }}>Xuất CSV</Button>}>
          <p className="text-sm text-slate-500">Chụp thực tế: {capturedTime(snapshot.capturedAt)} (giờ Việt Nam). Định giá theo dữ liệu đã nhập trên Sheet, không phải giá thị trường tự động.</p>
          <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm">
            <thead><tr><th className="py-2">Chỉ tiêu</th><th className="text-right">Đầu kỳ {previousMonth}</th><th className="text-right">Cuối kỳ {month}</th><th className="text-right">Biến động</th></tr></thead>
            <tbody>{([['total', 'Tài sản ròng'], ['cash', 'Nguồn tiền'], ['invested', 'Giá trị đầu tư'], ['cost', 'Giá vốn']] as const).map(([key, label]) => (
              <tr key={key} className="border-t border-slate-100 dark:border-slate-800"><td className="py-3">{label}</td><td className="text-right">{report.before ? formatVND(report.before[key]) : '—'}</td><td className="text-right">{formatVND(report.totals[key])}</td><td className="text-right">{report.before ? formatVND(report.totals[key] - report.before[key]) : '—'}</td></tr>
            ))}</tbody>
          </table></div>
          {previous && <p className="mt-2 text-xs text-slate-500">Snapshot đầu kỳ chụp lúc {capturedTime(previous.capturedAt)}.</p>}
          {!previous && <p className="mt-2 text-sm text-amber-600">Thiếu snapshot {previousMonth}; chưa thể tính biến động kỳ này.</p>}
          <p className="mt-2 text-xs text-slate-500">Biến động tài sản có thể gồm tiền nạp thêm/rút ra; không đại diện cho lợi nhuận đầu tư trong kỳ.</p>
        </Card>
        <Card title="Phân bổ cuối kỳ">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-3"><span>Nguồn tiền (gồm số dư nợ âm)</span><span>{formatVND(report.totals.cash)}</span></li>
            {[...new Set(report.data.assets.map((a) => a.categoryId))].map((id) => <li key={id} className="flex justify-between gap-3">
              <span>{report.data.assetCategories.find((c) => c.id === id)?.name ?? 'Chưa phân loại'}</span><span>{formatVND(report.data.assets.filter((a) => a.categoryId === id).reduce((sum, a) => sum + a.currentValue, 0))}</span>
            </li>)}
          </ul>
        </Card>
        <Card title="Chi tiết đã chốt">
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {report.data.accounts.map((a) => <li key={a.id} className="flex justify-between gap-3 py-2"><span>{a.name}{a.archived ? ' (lưu trữ)' : ''}</span><span>{formatVND(a.currentBalance)}</span></li>)}
            {report.data.assets.map((a) => <li key={a.id} className="flex justify-between gap-3 py-2"><div>{a.name}<p className="text-xs text-slate-500">{formatNumber(a.quantity)} {a.unit} · Vốn {formatVND(a.costBasis)}</p></div><span>{formatVND(a.currentValue)}</span></li>)}
          </ul>
        </Card>
      </>}
    </div>
  )
}
