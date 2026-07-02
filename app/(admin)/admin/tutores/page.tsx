import { PageContainer } from '@/components/page-container'
import { getAdminMembers, getAdminTutorFeeAssignments, getAdminTutors } from '@/lib/admin-app'
import { TutorsMembersClient } from './tutores-client'

export default async function AdminTutoresPage() {
  const [tutors, members, feeAssignments] = await Promise.all([
    getAdminTutors(),
    getAdminMembers(),
    getAdminTutorFeeAssignments(),
  ])

  return (
    <PageContainer
      title="Tutores / Socios"
      description="Gestión de tutores, familias y socios del club."
      className="max-w-7xl"
    >
      <TutorsMembersClient
        tutors={tutors}
        members={members}
        feeAssignments={feeAssignments}
      />
    </PageContainer>
  )
}
