import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input } from '../components/ui'
import { GUIDE_SECTIONS, type GuideBlock, type GuideSection } from '../components/guide/content'
import { useStore } from '../lib/store'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase()

/** Render **bold** markers. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, i) => (i % 2 ? <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
    </>
  )
}

function blockText(b: GuideBlock): string {
  switch (b.t) {
    case 'p':
    case 'note':
      return b.text
    case 'steps':
    case 'list':
      return b.items.join(' ')
    case 'table':
      return [...b.head, ...b.rows.flat()].join(' ')
    case 'faq':
      return b.items.map((f) => `${f.q} ${f.a}`).join(' ')
    case 'actions':
      return b.items.map((a) => a.label).join(' ')
    default:
      return ''
  }
}

const sectionText = (s: GuideSection) => norm([s.title, ...s.blocks.map(blockText)].join(' '))

function ConnectionStatus() {
  const configured = useStore((s) => !!s.settings.apiUrl)
  const sync = useStore((s) => s.sync)
  const detail = !configured
    ? 'Bạn chưa nhập Web App URL trong Cài đặt.'
    : sync.status === 'error'
      ? `Lỗi: ${sync.error}`
      : sync.lastSyncAt
        ? `Đồng bộ lần cuối: ${new Date(sync.lastSyncAt).toLocaleString('vi-VN')}`
        : 'Chưa đồng bộ lần nào.'
  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
        configured
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'
      }`}
    >
      <span className="font-semibold">Trạng thái hiện tại: {configured ? '✅ Đã kết nối' : '⚠️ Chưa kết nối'}</span>
      <span className="text-xs opacity-80">{detail}</span>
    </div>
  )
}

function Block({ b, query }: { b: GuideBlock; query: string }) {
  const navigate = useNavigate()
  switch (b.t) {
    case 'p':
      return <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"><Rich text={b.text} /></p>
    case 'steps':
      return (
        <ol className="space-y-2">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">{i + 1}</span>
              <span><Rich text={it} /></span>
            </li>
          ))}
        </ol>
      )
    case 'list':
      return (
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {b.items.map((it, i) => <li key={i}><Rich text={it} /></li>)}
        </ul>
      )
    case 'note':
      return (
        <div
          className={`rounded-xl border px-3 py-2 text-sm leading-relaxed ${
            b.tone === 'warn'
              ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'
              : 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200'
          }`}
        >
          {b.tone === 'warn' ? '⚠️ ' : '💡 '}<Rich text={b.text} />
        </div>
      )
    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>{b.head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {b.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className={`px-3 py-2 align-top text-slate-600 dark:text-slate-300 ${j === 0 ? 'font-medium whitespace-nowrap text-slate-900 dark:text-slate-100' : ''}`}><Rich text={c} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'actions':
      return (
        <div className="flex flex-wrap gap-2">
          {b.items.map((a) => (
            <Button key={a.to} variant={a.variant ?? 'primary'} onClick={() => navigate(a.to)}>{a.label} →</Button>
          ))}
        </div>
      )
    case 'status':
      return <ConnectionStatus />
    case 'faq': {
      const q = norm(query)
      const hits = q ? b.items.filter((f) => norm(`${f.q} ${f.a}`).includes(q)) : []
      const items = hits.length ? hits : b.items
      return (
        <div className="space-y-2">
          {items.map((f) => (
            <details key={f.q} open={hits.length > 0 || undefined} className="group rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
              <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-100">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.a}</p>
            </details>
          ))}
        </div>
      )
    }
  }
}

export default function Guide() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Set<string>>(() => new Set([GUIDE_SECTIONS[0].id]))
  const q = norm(query.trim())

  const index = useMemo(() => new Map(GUIDE_SECTIONS.map((s) => [s.id, sectionText(s)])), [])
  const visible = q ? GUIDE_SECTIONS.filter((s) => index.get(s.id)!.includes(q)) : GUIDE_SECTIONS

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const goto = (id: string) => {
    setQuery('')
    setOpen((prev) => new Set(prev).add(id))
    // đợi render xong (section có thể vừa được mở/hiện lại) rồi mới cuộn
    setTimeout(() => document.getElementById(`guide-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const chapter = (s: GuideSection, i: number): ReactNode => {
    const isOpen = !!q || open.has(s.id)
    return (
      <div key={s.id} id={`guide-${s.id}`} className="scroll-mt-16">
        <Card className="!p-0 overflow-hidden">
          <button
            type="button"
            onClick={() => toggle(s.id)}
            aria-expanded={isOpen}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <span className="text-xl">{s.icon}</span>
            <span className="flex-1 font-semibold">{i + 1}. {s.title}</span>
            <span className={`text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
          </button>
          {isOpen && (
            <div className="space-y-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800">
              {s.blocks.map((b, j) => <Block key={j} b={b} query={query.trim()} />)}
            </div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold">Hướng dẫn sử dụng</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Montana giúp bạn ghi thu chi, đặt ngân sách và theo dõi tài sản cá nhân. Chọn một mục bên dưới hoặc gõ từ khoá để tìm nhanh.
        </p>
      </div>

      <Input type="search" placeholder="Tìm trong hướng dẫn... (VD: token, 50k, ngân sách)" value={query} onChange={(e) => setQuery(e.target.value)} />

      <nav aria-label="Mục lục" className="flex flex-wrap gap-2">
        {GUIDE_SECTIONS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goto(s.id)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs hover:border-emerald-500 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:hover:text-emerald-300"
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">Không tìm thấy nội dung khớp với "{query}".</p>
      ) : (
        <div className="space-y-3">{visible.map((s) => chapter(s, GUIDE_SECTIONS.indexOf(s)))}</div>
      )}
    </div>
  )
}
