import { useEffect, useState } from 'react'
import { updateSettings, useStore } from '../../lib/store'
import { Button, Card, Field, Input } from '../ui'

export function MoneyInputSettings() {
  const settings = useStore((s) => s.settings)
  const [multiplier, setMultiplier] = useState(String(settings.moneyInputMultiplier ?? 1))
  const [currencyCode, setCurrencyCode] = useState(settings.moneyInputCurrencyCode ?? 'VND')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setMultiplier(String(settings.moneyInputMultiplier ?? 1))
    setCurrencyCode(settings.moneyInputCurrencyCode ?? 'VND')
  }, [settings.moneyInputMultiplier, settings.moneyInputCurrencyCode])

  const save = (event: React.FormEvent) => {
    event.preventDefault()
    const parsedMultiplier = Number(multiplier)
    const code = currencyCode.trim().toUpperCase()
    if (!Number.isFinite(parsedMultiplier) || parsedMultiplier <= 0) {
      setMessage('Hệ số phải là số lớn hơn 0.')
      return
    }
    if (!/^[A-Z]{3}$/.test(code)) {
      setMessage('Mã tiền phải gồm 3 chữ cái, ví dụ VND.')
      return
    }
    updateSettings({ moneyInputMultiplier: parsedMultiplier, moneyInputCurrencyCode: code })
    setMessage('Đã lưu hệ số nhập tiền.')
  }

  return (
    <Card title="Nhập tiền">
      <form className="space-y-3" onSubmit={save}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mã tiền nhập">
            <Input value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value.toUpperCase().slice(0, 3))} maxLength={3} placeholder="VND" />
          </Field>
          <Field label="Hệ số nhân">
            <Input type="number" min="0.00000001" step="any" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} />
          </Field>
        </div>
        <p className="text-xs text-slate-500">
          Ví dụ: mã VND, hệ số 1.000, nhập 20 sẽ lưu thành 20.000 ₫. Các số đã lưu và báo cáo vẫn dùng VND; đổi hệ số không sửa dữ liệu cũ.
        </p>
        <div className="flex items-center gap-3">
          <Button type="submit">Lưu</Button>
          {message && <span className="text-sm text-slate-500">{message}</span>}
        </div>
      </form>
    </Card>
  )
}
