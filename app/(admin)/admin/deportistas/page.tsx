import {
  getAdminAthletes,
  getAdminCategories,
  getAdminFeeTemplates,
  getAdminSeasons,
  getAdminTeams,
  getAdminTutorFeeAssignments,
  getAdminTutorOptions,
} from '@/lib/admin-app'
import { requireAdmin } from '@/lib/auth'
import { DeportistasClient } from './deportistas-client'

export default async function AdminDeportistasPage() {
  const { role } = await requireAdmin()
  const canManageFees = role === 'admin'
  const [athletes, categories, teams, seasons, tutors, feeTemplates, feeAssignments] = await Promise.all([
    getAdminAthletes(),
    getAdminCategories(),
    getAdminTeams(),
    getAdminSeasons(),
    getAdminTutorOptions(),
    canManageFees ? getAdminFeeTemplates() : Promise.resolve([]),
    canManageFees ? getAdminTutorFeeAssignments() : Promise.resolve([]),
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
      canManageFees={canManageFees}
    />
  )
}
