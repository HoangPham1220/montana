import { useEffect } from 'react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Accounts from './pages/Accounts'
import Categories from './pages/Categories'
import Assets from './pages/Assets'
import Settings from './pages/Settings'
import Guide from './pages/Guide'
import Reports from './pages/Reports'
import { getState, pendingCount, sync, useStore } from './lib/store'

const NAV: { to: string; label: string; icon: string; mobile?: boolean }[] = [
  { to: '/', label: 'Tổng quan', icon: 'M3 10 12 3l9 7v10H3z M9 20v-6h6v6' },
  { to: '/transactions', label: 'Thu chi', icon: 'M4 7h14m-4-4 4 4-4 4M20 17H6m4-4-4 4 4 4' },
  { to: '/accounts', label: 'Nguồn tiền', icon: 'M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13M15 11h6v4h-6a2 2 0 0 1 0-4Z' },
  { to: '/categories', label: 'Danh mục', icon: 'M3 12V4h8l10 10-7 7L3 10 M7 8h.01', mobile: false },
  { to: '/assets', label: 'Tài sản', icon: 'M3 10h18M5 10v9m5-9v9m4-9v9m5-9v9M2 21h20M12 3 2 8h20z' },
  { to: '/reports', label: 'Báo cáo', icon: 'M5 3h14v18H5z M8 16v-3m4 3V8m4 8v-5' },
  { to: '/settings', label: 'Cài đặt', icon: 'M4 7h16M4 17h16M8 4v6m8 4v6' },
]

function NavIcon({ path }: { path: string }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0"><path d={path} /></svg>
}

function SyncBadge() {
  const s = useStore((st) => st.sync)
  const pending = useStore(pendingCount)
  const configured = useStore((st) => !!st.settings.apiUrl)
  if (!configured) return <NavLink to="/settings" className="text-xs text-amber-600">Chưa kết nối Google Sheet</NavLink>
  const label =
    s.status === 'syncing' ? 'Đang đồng bộ…' : s.status === 'error' ? `Lỗi: ${s.error}` : pending ? `${pending} thay đổi chờ` : 'Đã đồng bộ'
  const color = s.status === 'error' ? 'text-rose-600' : pending ? 'text-amber-600' : 'text-emerald-600'
  return (
    <button onClick={() => void sync()} title="Đồng bộ ngay" className={`max-w-[50vw] truncate text-xs ${color}`}>
      ⟳ {label}
    </button>
  )
}

export default function App() {
  useEffect(() => {
    // Automatic triggers honour "Tự động đồng bộ"; the badge button always syncs.
    const auto = () => {
      const { apiUrl, autoSync } = getState().settings
      if (apiUrl && autoSync) void sync()
    }
    auto()
    const onFocus = auto
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onFocus)
    }
  }, [])

  return (
    <HashRouter>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col sm:flex-row">
        <aside className="hidden w-56 shrink-0 border-r border-[#e0e8d8] bg-white/70 p-5 sm:block dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mb-9 flex items-center gap-2 text-xl font-bold tracking-tight text-[#25341c] dark:text-lime-200"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c6e848] text-[#25341c]">M</span>Montana</div>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${isActive ? 'bg-[#e5efbf] font-semibold text-[#293c1c] dark:bg-[#354a2a] dark:text-lime-100' : 'text-[#586454] hover:bg-[#f0f4ea] dark:text-slate-300 dark:hover:bg-slate-800'}`
                }
              >
                <NavIcon path={n.icon} />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <NavLink
            to="/guide"
            className={({ isActive }) =>
              `mt-6 flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${isActive ? 'bg-[#e5efbf] font-semibold text-[#293c1c] dark:bg-[#354a2a] dark:text-lime-100' : 'text-[#586454] hover:bg-[#f0f4ea] dark:text-slate-300 dark:hover:bg-slate-800'}`
            }
          >
            <NavIcon path="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.5 9a2.5 2.5 0 1 1 4.5 1.5c-1 1-2 1.5-2 3M12 17h.01" />
            Hướng dẫn
          </NavLink>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col pb-24 sm:pb-0">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[#e0e8d8] bg-[#f5f7f1]/95 px-4 py-3 sm:px-6 dark:border-slate-800 dark:bg-slate-950/95">
            <span className="shrink-0 text-lg font-bold tracking-tight text-[#304327] sm:invisible dark:text-lime-200">Montana<span className="text-[#8eae32]">.</span></span>
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <SyncBadge />
              <NavLink to="/guide" className="rounded-full bg-white p-2 text-[#526348] sm:hidden dark:bg-slate-800 dark:text-slate-200" aria-label="Hướng dẫn"><NavIcon path="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.5 9a2.5 2.5 0 1 1 4.5 1.5c-1 1-2 1.5-2 3M12 17h.01" /></NavLink>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/guide" element={<Guide />} />
            </Routes>
          </main>
        </div>
        <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-[#e0e8d8] bg-white pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:hidden dark:border-slate-800 dark:bg-slate-900">
          {NAV.filter((n) => n.mobile !== false).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => `flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[10px] ${isActive ? 'font-semibold text-[#4b6524] dark:text-lime-300' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <NavIcon path={n.icon} />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </HashRouter>
  )
}
