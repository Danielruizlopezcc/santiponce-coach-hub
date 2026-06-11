import { getAdminTeams, getAdminCategories, getAdminSeasons } from '@/lib/admin-app'
import { EquiposClient } from './equipos-client'

export default async function AdminEquiposPage() {
  const [teams, categories, seasons] = await Promise.all([
    getAdminTeams(),
    getAdminCategories(),
    getAdminSeasons(),
  ])
  return <EquiposClient teams={teams} categories={categories} seasons={seasons} />
}
