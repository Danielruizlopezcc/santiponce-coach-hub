export const TEAM_CATEGORY_ORDER = [
  { key: 'senior', label: 'Senior' },
  { key: 'juvenil', label: 'Juvenil' },
  { key: 'cadete', label: 'Cadete' },
  { key: 'infantil', label: 'Infantil' },
  { key: 'alevin', label: 'Alevín' },
  { key: 'benjamin', label: 'Benjamín' },
  { key: 'prebenjamin', label: 'Prebenjamín' },
  { key: 'bebe', label: 'Bebés' },
] as const

function normalizeForSort(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export function getTeamCategorySortInfo(teamName: string, categoryName: string) {
  const source = `${normalizeForSort(teamName)} ${normalizeForSort(categoryName)}`
  const index = TEAM_CATEGORY_ORDER.findIndex((category) => source.includes(category.key))
  const category = index >= 0 ? TEAM_CATEGORY_ORDER[index] : null

  return {
    order: index >= 0 ? index : 999,
    label: category?.label ?? categoryName,
  }
}

export function getTeamSuffixOrder(teamName: string) {
  const match = normalizeForSort(teamName).match(/(?:^|\s)([a-z])$/)
  if (!match) return 999
  return match[1].charCodeAt(0) - 'a'.charCodeAt(0)
}

