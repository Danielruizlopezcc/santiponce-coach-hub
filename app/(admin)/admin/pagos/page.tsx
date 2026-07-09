import { PageContainer } from '@/components/page-container'
import {
  getAdminAthletes,
  getAdminEnrollments,
  getAdminFeeTemplates,
  getAdminFinanceMovements,
  getAdminPayments,
  getAdminSeasons,
  getAdminTutorFeeAssignments,
} from '@/lib/admin-app'
import { AdminPaymentsClient } from './payments-client'

export default async function AdminPagosPage() {
  const [payments, financeMovements, enrollments, feeTemplates, seasons, feeAssignments, athletes] = await Promise.all([
    getAdminPayments(),
    getAdminFinanceMovements(),
    getAdminEnrollments(),
    getAdminFeeTemplates(),
    getAdminSeasons(),
    getAdminTutorFeeAssignments(),
    getAdminAthletes(),
  ])

  return (
    <PageContainer
      title="Contabilidad"
      description="Gestión separada de cobros a familias, cuotas asignadas y movimientos contables del club."
      className="max-w-7xl"
    >
      <AdminPaymentsClient
        payments={payments}
        financeMovements={financeMovements}
        enrollments={enrollments}
        feeTemplates={feeTemplates}
        seasons={seasons}
        feeAssignments={feeAssignments}
        athletes={athletes}
      />
    </PageContainer>
  )
}
