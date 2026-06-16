import { PageContainer } from '@/components/page-container'
import { getAdminMembers, getAdminTutors } from '@/lib/admin-app'
import { TutorsMembersClient } from './tutores-client'

export default async function AdminTutoresPage() {
  const [tutors, members] = await Promise.all([
    getAdminTutors(),
    getAdminMembers(),
  ])

  return (
    <PageContainer
      title="Tutores / Socios"
      description="Gestión de tutores, familias y socios del club."
      className="max-w-7xl"
    >
      <TutorsMembersClient tutors={tutors} members={members} />
    </PageContainer>
  )
}
