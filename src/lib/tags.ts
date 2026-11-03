import type { Tag, Transaction } from './types'
import { getState, newId, upsert } from './store'

export const normalizeTagName = (name: string) => name.trim().replace(/^#+/, '').toLowerCase().normalize('NFC')
export const validTagName = (name: string) => /^[\p{L}\p{N}_-]{1,30}$/u.test(name)

export function saveTag(name: string, tag?: Tag): Tag {
  name = normalizeTagName(name)
  if (!validTagName(name)) throw new Error('Thẻ tối đa 30 ký tự, chỉ gồm chữ, số, _ hoặc -.')
  const tags = getState().tables.tags
  if (tags.some((t) => !t.deleted && t.name === name && t.id !== tag?.id)) throw new Error('Thẻ này đã tồn tại.')
  const stableId = `tag:${encodeURIComponent(name)}`
  return upsert('tags', { ...tag, id: tag?.id ?? (tags.some((t) => t.id === stableId) ? newId() : stableId), name, archived: tag?.archived ?? false })
}

export function tagUsage(transactions: Transaction[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const t of transactions) if (!t.deleted) for (const id of t.tagIds ?? []) counts.set(id, (counts.get(id) ?? 0) + 1)
  return counts
}
