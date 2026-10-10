import { useMemo, useState } from 'react'
import { formatVND, today } from '../../lib/format'
import { DEFAULT_ACCOUNT_ID } from '../../lib/defaults'
import { deleteTransaction, saveTransaction, txAccountId, useAccountBalances } from '../../lib/accounts'
import { isSelectableCategory } from '../../lib/categoryTree'
import type { Account, Category, Transaction, TransactionType } from '../../lib/types'
import { Button, Field, Input, Modal, MoneyInput, Select } from '../ui'
import TypeToggle from './TypeToggle'

interface Props {
  open: boolean
  editing: Transaction | null
  categories: Category[]
  defaultType?: TransactionType
  defaultDate?: string
  defaultAccountId?: string
  onClose: () => void
}

const LAST_ACCOUNT_KEY = 'montana:lastAccount'

function readLastAccount(): string | undefined {
  try {
    return localStorage.getItem(LAST_ACCOUNT_KEY) || undefined
  } catch {
    return undefined
  }
}

function rememberAccount(id: string) {
  try {
    localStorage.setItem(LAST_ACCOUNT_KEY, id)
  } catch {
    /* ignore */
  }
}

export default function TransactionForm({ open, ...rest }: Props) {
  return (
    <Modal open={open} title={rest.editing ? 'Sửa giao dịch' : 'Thêm giao dịch'} onClose={rest.onClose}>
      <Body {...rest} />
    </Modal>
  )
}

function Body({ editing, categories, defaultType = 'expense', defaultDate, defaultAccountId, onClose }: Omit<Props, 'open'>) {
  const { accounts, balances } = useAccountBalances()
  const [type, setType] = useState<TransactionType>(editing?.type ?? defaultType)
  const [accountId, setAccountId] = useState(() => {
    const id = editing ? txAccountId(editing) : (defaultAccountId ?? readLastAccount() ?? DEFAULT_ACCOUNT_ID)
    return id
  })
  const [toAccountId, setToAccountId] = useState(editing?.toAccountId ?? '')
  const [amount, setAmount] = useState(editing?.amount ?? 0)
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? '')
  const [date, setDate] = useState(editing?.date ?? defaultDate ?? today())
  const [note, setNote] = useState(editing?.note ?? '')
  const [amountKey, setAmountKey] = useState(0)
  const [error, setError] = useState('')

  // Non-archived accounts, plus archived ones still referenced by this form.
  const accountOptions = useMemo(
    () => accounts.filter((a) => !a.archived || a.id === accountId || a.id === toAccountId),
    [accounts, accountId, toAccountId],
  )
  const accLabel = (a: Account) => `${a.icon} ${a.name} (${formatVND(balances.get(a.id) ?? 0)})`
  const isTransfer = type === 'transfer'

  const options = useMemo(
    () => categories.filter((c) => c.type === type && isSelectableCategory(c, categories)),
    [categories, type],
  )
  // Keep selection only if it is valid for the current type.
  const selected = options.some((c) => c.id === categoryId) ? categoryId : ''

  const save = (again: boolean) => {
    if (amount <= 0) return setError('Nhập số tiền lớn hơn 0')
    if (isTransfer) {
      if (!accountId || !toAccountId) return setError('Chọn nguồn tiền đi và đến')
      if (accountId === toAccountId) return setError('Nguồn tiền đi và đến phải khác nhau')
    } else if (!selected) return setError('Chọn danh mục')
    if (!date) return setError('Chọn ngày')
    saveTransaction({
      id: editing?.id,
      type,
      amount,
      categoryId: isTransfer ? '' : selected,
      accountId,
      toAccountId: isTransfer ? toAccountId : '',
      date,
      note: note.trim(),
    })
    rememberAccount(accountId)
    if (again && !editing) {
      setAmount(0)
      setNote('')
      setError('')
      setAmountKey((k) => k + 1) // remount MoneyInput to refocus
    } else onClose()
  }

  const del = () => {
    if (editing && window.confirm('Xoá giao dịch này?')) {
      deleteTransaction(editing.id)
      onClose()
    }
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        save(false)
      }}
    >
      <TypeToggle allowTransfer value={type} onChange={setType} />
      <Field label="Số tiền (VND)">
        <MoneyInput key={amountKey} autoFocus value={amount} onChange={setAmount} placeholder="VD: 50k, 1,5tr" />
      </Field>
      {isTransfer ? (
        <>
          <Field label="Từ">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accountOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {accLabel(a)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Đến">
            <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
              <option value="">-- Chọn nguồn tiền --</option>
              {accountOptions
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {accLabel(a)}
                  </option>
                ))}
            </Select>
          </Field>
        </>
      ) : (
        <>
          <Field label="Danh mục">
            <Select value={selected} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">-- Chọn danh mục --</option>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.parentId ? `↳ ${c.name}` : c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nguồn tiền">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accountOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {accLabel(a)}
                </option>
              ))}
            </Select>
          </Field>
        </>
      )}
      <Field label="Ngày">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Ghi chú">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tuỳ chọn" />
      </Field>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit">Lưu</Button>
        {!editing && (
          <Button type="button" variant="secondary" onClick={() => save(true)}>
            Lưu & thêm tiếp
          </Button>
        )}
        {editing && (
          <Button type="button" variant="danger" className="ml-auto" onClick={del}>
            Xoá
          </Button>
        )}
      </div>
    </form>
  )
}
