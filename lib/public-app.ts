import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { getTeamCategorySortInfo, getTeamSuffixOrder } from '@/lib/team-order'

export type PublicNavTeam = {
  id: string
  name: string
  category: string
}

export type PublicNavNewsSection = {
  id: string
  name: string
}

export type PublicNavData = {
  teams: PublicNavTeam[]
  newsSections: PublicNavNewsSection[]
}

export async function getPublicNavData(): Promise<PublicNavData> {
  const supabase = createAdminClient()
  const [{ data: teams }, { data: categories }, { data: sections }] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name, category_id, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase.from('categories').select('id, name, sort_order'),
    supabase
      .from('news_sections')
      .select('id, name, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
  ])

  const categoryById = new Map(
    (categories ?? []).map((category) => [
      category.id,
      { name: category.name, sortOrder: category.sort_order },
    ]),
  )

  return {
    teams: (teams ?? [])
      .map((team) => {
        const category = categoryById.get(team.category_id)
        const categoryName = category?.name ?? 'Sin categoría'
        const sortInfo = getTeamCategorySortInfo(team.name, categoryName)

        return {
          id: team.id,
          name: team.name,
          category: sortInfo.label,
          categoryOrder: sortInfo.order,
          suffixOrder: getTeamSuffixOrder(team.name),
        }
      })
      .sort((a, b) => {
        if (a.categoryOrder !== b.categoryOrder) return a.categoryOrder - b.categoryOrder
        if (a.suffixOrder !== b.suffixOrder) return a.suffixOrder - b.suffixOrder
        return a.name.localeCompare(b.name, 'es')
      })
      .map(({ categoryOrder, suffixOrder, ...team }) => team),
    newsSections: (sections ?? []).map((section) => ({
      id: section.id,
      name: section.name,
    })),
  }
}
