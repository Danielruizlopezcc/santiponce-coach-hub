import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

const TEAM_SHIRT_NUMBERS_SETTINGS_KEY = 'team_shirt_numbers'

export type TeamShirtNumberMap = Record<string, number>

function normalizeShirtNumberMap(value: unknown): TeamShirtNumberMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(
    Object.entries(value).flatMap(([athleteId, shirtNumber]) => {
      const parsed = Number(shirtNumber)
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99) return []
      return [[athleteId, parsed]]
    }),
  )
}

export async function getTeamShirtNumbers(): Promise<TeamShirtNumberMap> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', TEAM_SHIRT_NUMBERS_SETTINGS_KEY)
    .maybeSingle()

  if (error || !data?.value) return {}

  try {
    return normalizeShirtNumberMap(JSON.parse(data.value))
  } catch {
    return {}
  }
}

export async function saveTeamShirtNumbers(shirtNumbers: TeamShirtNumberMap) {
  const supabase = createAdminClient()
  const normalized = normalizeShirtNumberMap(shirtNumbers)
  const { error } = await supabase
    .from('app_settings')
    .upsert({
      key: TEAM_SHIRT_NUMBERS_SETTINGS_KEY,
      value: JSON.stringify(normalized),
    })

  if (error) throw new Error(error.message)
}
