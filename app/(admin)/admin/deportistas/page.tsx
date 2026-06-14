import { getAdminAthletes, getAdminCategories } from '@/lib/admin-app'
import { DeportistasClient } from './deportistas-client'

export default async function AdminDeportistasPage() {
  const [athletes, categories] = await Promise.all([
    getAdminAthletes(),
    getAdminCategories(),
  ])

  return <DeportistasClient athletes={athletes} categories={categories} />
}
