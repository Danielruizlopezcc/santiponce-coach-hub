import {
  getAdminAthletes,
  getAdminCategories,
  getAdminFeeTemplates,
  getAdminSeasons,
  getAdminTeams,
  getAdminTutorFeeAssignments,
  getAdminTutorOptions,
} from '@/lib/admin-app'
import { DeportistasClient } from './deportistas-client'

export default async function AdminDeportistasPage() {
  const [athletes, categories, teams, seasons, tutors, feeTemplates, feeAssignments] = await Promise.all([
    getAdminAthletes(),
    getAdminCategories(),
    getAdminTeams(),
    getAdminSeasons(),
    getAdminTutorOptions(),
    getAdminFeeTemplates(),
    getAdminTutorFeeAssignments(),
  ])

  return (
    <DeportistasClient
      athletes={athletes}
      categories={categories}
      teams={teams}
      seasons={seasons}
      tutors={tutors}
      feeTemplates={feeTemplates}
      feeAssignments={feeAssignments}
    />
  )
}
