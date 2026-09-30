import { useMemo, useState } from 'react'
import { useStore, useTable } from '../lib/store'
import { ACCOUNTS_ASSET_CATEGORY_ID, totalCashBalance, useAccountBalances } from '../lib/accounts'
import { today } from '../lib/format'
import type { Asset } from '../lib/types'
import SummaryCards from '../components/assets/SummaryCards'
import AllocationCard, { type Slice } from '../components/assets/AllocationCard'
import HistoryCard from '../components/assets/HistoryCard'
import AssetGroups, { type Group } from '../components/assets/AssetGroups'
import AssetFormModal from '../components/assets/AssetFormModal'
import QuickValueModal from '../components/assets/QuickValueModal'
import CategoriesModal from '../components/assets/CategoriesModal'
import { buildHistory, UNCATEGORIZED_COLOR, UNCATEGORIZED_ID } from '../components/assets/utils'

export default function Assets() {
  const assets = useTable('assets')
  const categories = useTable('assetCategories')
  const allAssets = useStore((s) => s.tables.assets)
  const allTxs = useStore((s) => s.tables.transactions)
  const { accounts, balances, total: cashTotal } = useAccountBalances()
  const allSnapshots = useStore((s) => s.tables.assetSnapshots)

  const [form, setForm] = useState<{ asset: Asset | null } | null>(null)
  const [quick, setQuick] = useState<Asset | null>(null)
  const [catsOpen, setCatsOpen] = useState(false)

  const { totalValue, totalInvested, totalCost, groups, slices } = useMemo(() => {
    const totalInvested = assets.reduce((n, a) => n + a.currentValue, 0)
    const totalValue = totalInvested + cashTotal
    const totalCost = assets.reduce((n, a) => n + a.costBasis, 0)
    const groups: Group[] = categories.map((c) => ({ id: c.id, name: c.name, color: c.color, assets: [] as Asset[] }))
    const orphan: Group = { id: UNCATEGORIZED_ID, name: 'Chưa phân loại', color: UNCATEGORIZED_COLOR, assets: [] }
    for (const a of assets) (groups.find((g) => g.id === a.categoryId) ?? orphan).assets.push(a)
    const liveAccounts = accounts
      .filter((a) => !a.archived)
      .map((a) => ({ id: a.id, name: a.name, icon: a.icon, balance: balances.get(a.id) ?? 0 }))
    if (liveAccounts.length) (groups.find((g) => g.id === ACCOUNTS_ASSET_CATEGORY_ID) ?? orphan).accounts = liveAccounts
    if (orphan.assets.length || orphan.accounts?.length) groups.push(orphan)
    const visible = groups.filter((g) => g.assets.length > 0 || (g.accounts?.length ?? 0) > 0)
    visible.forEach((g) => g.assets.sort((x, y) => y.currentValue - x.currentValue))
    const sumOf = (g: Group) =>
      g.assets.reduce((n, a) => n + a.currentValue, 0) + (g.accounts ?? []).reduce((n, a) => n + a.balance, 0)
    visible.sort((x, y) => sumOf(y) - sumOf(x))
    const slices: Slice[] = groups.map((g) => ({
      id: g.id, name: g.name, color: g.color, value: sumOf(g),
      target: categories.find((c) => c.id === g.id)?.targetPercent ?? 0,
    }))
    return { totalValue, totalInvested, totalCost, groups: visible, slices }
  }, [assets, categories, accounts, balances, cashTotal])

  const history = useMemo(
    () =>
      buildHistory(allAssets, allSnapshots, {
        dates: [today()],
        valueAt: (d) => totalCashBalance(accounts, allTxs, d),
      }),
    [allAssets, allSnapshots, accounts, allTxs],
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Tài sản</h1>
      <SummaryCards value={totalValue} invested={totalInvested} cost={totalCost} />
      <AllocationCard slices={slices} total={totalValue} />
      <HistoryCard points={history} />
      <AssetGroups
        groups={groups}
        total={totalValue}
        onEdit={(a) => setForm({ asset: a })}
        onQuickValue={setQuick}
        onAdd={() => setForm({ asset: null })}
        onManageCategories={() => setCatsOpen(true)}
      />
      <AssetFormModal open={!!form} asset={form?.asset ?? null} categories={categories} onClose={() => setForm(null)} />
      <QuickValueModal asset={quick} onClose={() => setQuick(null)} />
      <CategoriesModal open={catsOpen} categories={categories} assets={assets} onClose={() => setCatsOpen(false)} />
    </div>
  )
}
