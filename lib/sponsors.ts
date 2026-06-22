export type SponsorTier = 'principal' | 'destacado' | 'partner'

export const SPONSOR_TIER_OPTIONS: Array<{
  value: SponsorTier
  label: string
  sortOrder: number
}> = [
  { value: 'principal', label: 'Patrocinador principal', sortOrder: 1 },
  { value: 'destacado', label: 'Patrocinador destacado', sortOrder: 2 },
  { value: 'partner', label: 'Partner oficial', sortOrder: 3 },
]

export function getSponsorTierFromSortOrder(sortOrder?: number | null): SponsorTier {
  if (sortOrder === 1) return 'principal'
  if (sortOrder === 2) return 'destacado'
  return 'partner'
}

export function getSponsorTierOption(tier: SponsorTier) {
  return SPONSOR_TIER_OPTIONS.find((option) => option.value === tier) ?? SPONSOR_TIER_OPTIONS[2]
}
