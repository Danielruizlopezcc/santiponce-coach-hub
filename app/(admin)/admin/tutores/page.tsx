import { PageContainer } from '@/components/page-container'
import { getAdminFeeTemplates, getAdminMembers, getAdminTutorFeeAssignments, getAdminTutors } from '@/lib/admin-app'
import { TutorsMembersClient } from './tutores-client'

export default async function AdminTutoresPage() {
  const [tutors, members, feeTemplates, feeAssignments] = await Promise.all([
    getAdminTutors(),
    getAdminMembers(),
    getAdminFeeTemplates(),
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
        feeTemplates={feeTemplates}
        feeAssignments={feeAssignments}
      />
    </PageContainer>
  )
}
