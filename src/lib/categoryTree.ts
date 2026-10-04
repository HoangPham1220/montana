import type { Category } from './types'

export function parentCategory(category: Category, categories: Category[]) {
  return categories.find((item) => item.id === category.parentId)
}

export function categoryLabel(category: Category | undefined, categories: Category[]) {
  if (!category) return 'Không rõ danh mục'
  const parent = parentCategory(category, categories)
  return parent ? `${parent.name} › ${category.name}` : category.name
}

export function rootCategory(category: Category, categories: Category[]) {
  return parentCategory(category, categories) ?? category
}

export function isSelectableCategory(category: Category, categories: Category[]) {
  return !categories.some((item) => item.parentId === category.id)
}

export function categorySpend(category: Category, categories: Category[], spendById: Map<string, number>) {
  return (spendById.get(category.id) ?? 0) + categories
    .filter((item) => item.parentId === category.id)
    .reduce((total, item) => total + (spendById.get(item.id) ?? 0), 0)
}
