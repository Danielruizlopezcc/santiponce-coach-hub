import { PageContainer } from '@/components/page-container'
import {
  getAdminEnrollments,
  getAdminFeeTemplates,
  getAdminFinanceMovements,
  getAdminPayments,
  getAdminSeasons,
  getAdminTutorFeeAssignments,
} from '@/lib/admin-app'
import { AdminPaymentsClient } from './payments-client'

export default async function AdminPagosPage() {
  const [payments, financeMovements, enrollments, feeTemplates, seasons, feeAssignments] = await Promise.all([
    getAdminPayments(),
    getAdminFinanceMovements(),
    getAdminEnrollments(),
    getAdminFeeTemplates(),
    getAdminSeasons(),
    getAdminTutorFeeAssignments(),
  ])

  return (
    <PageContainer
      title="Contabilidad"
      description="Resumen financiero, histórico y seguimiento de operaciones registradas en la plataforma."
      className="max-w-7xl"
    >
      <AdminPaymentsClient
        payments={payments}
        financeMovements={financeMovements}
        enrollments={enrollments}
        feeTemplates={feeTemplates}
        seasons={seasons}
        feeAssignments={feeAssignments}
      />
    </PageContainer>
  )
}
