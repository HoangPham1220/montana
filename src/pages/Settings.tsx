import { ConnectionCard } from '../components/settings/ConnectionCard'
import { DataTools } from '../components/settings/DataTools'
import { MoneyInputSettings } from '../components/settings/MoneyInputSettings'

export default function Settings() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Cài đặt</h1>
      <MoneyInputSettings />
      <ConnectionCard />
      <DataTools />
    </div>
  )
}
