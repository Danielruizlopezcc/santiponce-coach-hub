import { notFound } from 'next/navigation'
import { getAdminCategories, getAdminSeasons, getAdminTeamDetail } from '@/lib/admin-app'
import { EquipoDetailClient } from './equipo-detail-client'

type Props = { params: Promise<{ id: string }> }

export default async function AdminEquipoDetailPage({ params }: Props) {
  const { id } = await params
  const [team, categories, seasons] = await Promise.all([
    getAdminTeamDetail(id),
    getAdminCategories(),
    getAdminSeasons(),
  ])
  if (!team) notFound()
  return <EquipoDetailClient team={team} categories={categories} seasons={seasons} />
}
