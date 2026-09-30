import { useEffect } from 'react'
import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Accounts from './pages/Accounts'
import Categories from './pages/Categories'
import Assets from './pages/Assets'
import Settings from './pages/Settings'
import Guide from './pages/Guide'
import { getState, pendingCount, sync, useStore } from './lib/store'

const NAV: { to: string; label: string; icon: string; mobile?: boolean }[] = [
  { to: '/', label: 'Tổng quan', icon: '📊' },
  { to: '/transactions', label: 'Thu chi', icon: '💸' },
  { to: '/accounts', label: 'Nguồn tiền', icon: '👛' },
  { to: '/categories', label: 'Danh mục', icon: '🏷️', mobile: false },
  { to: '/assets', label: 'Tài sản', icon: '🏦' },
  { to: '/settings', label: 'Cài đặt', icon: '⚙️' },
]

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
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col sm:flex-row">
        <aside className="hidden w-52 shrink-0 border-r border-slate-200 p-4 sm:block dark:border-slate-800">
          <div className="mb-6 text-lg font-bold text-emerald-600">Montana</div>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`
                }
              >
                <span>{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <NavLink
            to="/guide"
            className={({ isActive }) =>
              `mt-6 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`
            }
          >
            <span>❓</span>
            Hướng dẫn
          </NavLink>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col pb-20 sm:pb-0">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
            <span className="font-bold text-emerald-600 sm:invisible">Montana</span>
            <div className="flex items-center gap-3">
              <SyncBadge />
              <NavLink to="/guide" className="text-lg sm:hidden" aria-label="Hướng dẫn">❓</NavLink>
            </div>
          </header>
          <main className="flex-1 p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/guide" element={<Guide />} />
            </Routes>
          </main>
        </div>
        <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white sm:hidden dark:border-slate-800 dark:bg-slate-900">
          {NAV.filter((n) => n.mobile !== false).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) => `flex flex-1 flex-col items-center py-2 text-[11px] ${isActive ? 'text-emerald-600' : 'text-slate-500'}`}
            >
              <span className="text-lg">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </HashRouter>
  )
}
