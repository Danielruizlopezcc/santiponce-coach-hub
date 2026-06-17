import { getAdminAthletes, getAdminCategories, getAdminSeasons, getAdminTeams, getAdminTutorOptions } from '@/lib/admin-app'
import { DeportistasClient } from './deportistas-client'

export default async function AdminDeportistasPage() {
  const [athletes, categories, teams, seasons, tutors] = await Promise.all([
    getAdminAthletes(),
    getAdminCategories(),
    getAdminTeams(),
    getAdminSeasons(),
    getAdminTutorOptions(),
  ])

  return <DeportistasClient athletes={athletes} categories={categories} teams={teams} seasons={seasons} tutors={tutors} />
}
