import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact } from '../components/dashboard/compact'
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
      report = { data, totals: snapshotTotals(data) }
      if (previous) report.before = snapshotTotals(parseSnapshot(previous))
    }
  } catch (e) { error = (e as Error).message }

  const comparison = report ? ([['total', 'Tài sản ròng'], ['cash', 'Nguồn tiền'], ['invested', 'Đầu tư'], ['cost', 'Giá vốn']] as const).map(([key, name]) => ({
    name, before: report.before?.[key], current: report.totals[key],
  })) : []
  const allocation = report ? [
    { id: 'cash', name: 'Nguồn tiền', value: report.totals.cash },
    ...[...new Set(report.data.assets.map((a) => a.categoryId))].map((id) => ({
      id: `asset:${id}`, name: report.data.assetCategories.find((c) => c.id === id)?.name ?? 'Chưa phân loại',
      value: report.data.assets.filter((a) => a.categoryId === id).reduce((sum, a) => sum + a.currentValue, 0),
    })),
  ].sort((a, b) => b.value - a.value) : []

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Báo cáo tài sản</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">So sánh tài sản tại hai mốc đã chốt, cách nhau 1, 3 hoặc 12 tháng.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="So sánh với"><Select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          <option value="1">1 tháng trước</option><option value="3">3 tháng trước</option><option value="12">12 tháng trước</option>
        </Select></Field>
        <Field label="Mốc báo cáo"><Input type="month" value={month} onChange={(e) => { if (e.target.value) setMonth(e.target.value) }} /></Field>
      </div>
      <p className="text-sm text-slate-500">Các kỳ đã có: {snapshots.length ? [...snapshots].sort((a, b) => b.month.localeCompare(a.month)).map((s) => (
        <button key={s.id} className="mr-3 text-emerald-600 underline" onClick={() => setMonth(s.month)}>{s.month}</button>
      )) : 'Chưa có snapshot.'} <Link className="text-emerald-600 underline" to="/settings">Cài đặt lịch</Link></p>
      {error && <p role="alert" className="text-rose-600">{error}</p>}
      {!snapshot && <Card><EmptyState>Chưa có snapshot tháng {month}. Đồng bộ để tải số đã chốt từ Google Sheet. App không dựng lại snapshot từ dữ liệu hiện tại.</EmptyState></Card>}
      {snapshot && report && <>
        <Card title={`So sánh tài sản · ${month}`} action={<Button variant="secondary" onClick={() => {
          const rows: (string | number)[][] = [['Tháng', 'Ngày chụp', 'Loại', 'Tên', 'Danh mục', 'Số lượng', 'Đơn vị', 'Giá vốn', 'Giá trị']]
          for (const a of report.data.accounts) rows.push([month, snapshot.capturedAt, 'Nguồn tiền', a.name, a.kind, '', '', '', a.currentBalance])
          for (const a of report.data.assets) rows.push([month, snapshot.capturedAt, 'Tài sản', a.name, report.data.assetCategories.find((c) => c.id === a.categoryId)?.name ?? 'Chưa phân loại', a.quantity, a.unit, a.costBasis, a.currentValue])
          download(`montana-tai-san-${month}.csv`, '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8')
        }}>Xuất CSV</Button>}>
          <p className="text-xs text-slate-500 dark:text-slate-400">Chụp thực tế: {capturedTime(snapshot.capturedAt)} (giờ Việt Nam).</p>
          <div className="mt-4 h-72" aria-label="So sánh tài sản; số liệu chính xác trong bảng bên dưới">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#94a3b8" strokeOpacity={0.25} strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} tickLine={false} axisLine={false} />
                <YAxis width={64} tickFormatter={formatCompact} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatVND(Number(v))} cursor={{ fill: 'rgba(148,163,184,0.12)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={0} stroke="#94a3b8" />
                {report.before && <Bar dataKey="before" name={`Mốc ${previousMonth}`} fill="#94a3b8" isAnimationActive={false} />}
                <Bar dataKey="current" name={`Mốc ${month}`} fill="#059669" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <dl className="mt-4 flex flex-wrap gap-x-10 gap-y-3 border-t border-slate-100 pt-4 tabular-nums dark:border-slate-800">
            <div><dt className="text-sm text-slate-500 dark:text-slate-400">Tài sản ròng</dt><dd className="text-xl font-semibold">{formatVND(report.totals.total)}</dd></div>
            <div><dt className="text-sm text-slate-500 dark:text-slate-400">Thay đổi so với {previousMonth}</dt><dd className="text-xl font-semibold">{report.before ? `${report.totals.total > report.before.total ? '+' : ''}${formatVND(report.totals.total - report.before.total)}` : 'Chưa có số so sánh'}</dd></div>
          </dl>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium">Xem bảng số liệu</summary>
          <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm">
            <thead><tr><th className="py-2">Chỉ tiêu</th><th className="text-right">Mốc {previousMonth}</th><th className="text-right">Mốc {month}</th><th className="text-right">Biến động</th></tr></thead>
            <tbody>{([['total', 'Tài sản ròng'], ['cash', 'Nguồn tiền'], ['invested', 'Giá trị đầu tư'], ['cost', 'Giá vốn']] as const).map(([key, label]) => (
              <tr key={key} className="border-t border-slate-100 dark:border-slate-800"><td className="py-3">{label}</td><td className="text-right">{report.before ? formatVND(report.before[key]) : '—'}</td><td className="text-right">{formatVND(report.totals[key])}</td><td className="text-right">{report.before ? formatVND(report.totals[key] - report.before[key]) : '—'}</td></tr>
            ))}</tbody>
          </table></div>
          </details>
          {previous && report.before && <p className="mt-2 text-xs text-slate-500">Mốc so sánh chụp lúc {capturedTime(previous.capturedAt)}.</p>}
          {!previous && <p className="mt-2 text-sm text-amber-600">Thiếu snapshot {previousMonth}; chưa thể tính biến động kỳ này.</p>}
          <p className="mt-2 text-xs text-slate-500">Biến động tài sản có thể gồm tiền nạp thêm/rút ra; không đại diện cho lợi nhuận đầu tư trong kỳ.</p>
        </Card>
        <Card title={`Phân bổ tài sản · ${month}`}>
          <p className="text-xs text-slate-500 dark:text-slate-400">Giá trị theo danh mục (VND). Nguồn tiền gồm cả số dư nợ âm.</p>
          <div className="mt-3" style={{ height: Math.max(180, allocation.length * 48) }} aria-label="Phân bổ tài sản; giá trị chính xác ở danh sách bên dưới">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allocation} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#94a3b8" strokeOpacity={0.25} strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatCompact} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => formatVND(Number(v))} cursor={{ fill: 'rgba(148,163,184,0.12)' }} />
                <ReferenceLine x={0} stroke="#94a3b8" />
                <Bar dataKey="value" name="Giá trị" barSize={22} isAnimationActive={false}>
                  {allocation.map((a) => <Cell key={a.id} fill={a.value < 0 ? '#e11d48' : '#059669'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-3"><span>Nguồn tiền (gồm số dư nợ âm)</span><span>{formatVND(report.totals.cash)}</span></li>
            {[...new Set(report.data.assets.map((a) => a.categoryId))].map((id) => <li key={id} className="flex justify-between gap-3">
              <span>{report.data.assetCategories.find((c) => c.id === id)?.name ?? 'Chưa phân loại'}</span><span>{formatVND(report.data.assets.filter((a) => a.categoryId === id).reduce((sum, a) => sum + a.currentValue, 0))}</span>
            </li>)}
          </ul>
        </Card>
        <Card>
          <details>
            <summary className="cursor-pointer font-semibold">Chi tiết đã chốt · {report.data.accounts.length + report.data.assets.length} mục</summary>
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {report.data.accounts.map((a) => <li key={a.id} className="flex justify-between gap-3 py-2"><span>{a.name}{a.archived ? ' (lưu trữ)' : ''}</span><span>{formatVND(a.currentBalance)}</span></li>)}
            {report.data.assets.map((a) => <li key={a.id} className="flex justify-between gap-3 py-2"><div>{a.name}<p className="text-xs text-slate-500">{formatNumber(a.quantity)} {a.unit} · Vốn {formatVND(a.costBasis)}</p></div><span>{formatVND(a.currentValue)}</span></li>)}
          </ul>
          </details>
          <details className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            <summary className="cursor-pointer">Cách đọc báo cáo</summary>
            <p className="mt-2">Mốc lịch chụp: {formatDate(snapshot.scheduledDate)}. Số liệu chốt tại thời điểm chụp thực tế, gồm nguồn tiền lưu trữ; không phải số cuối quý/năm dương lịch. Định giá theo dữ liệu đã nhập trên Sheet, không tự cập nhật giá thị trường.</p>
          </details>
        </Card>
      </>}
    </div>
  )
}
