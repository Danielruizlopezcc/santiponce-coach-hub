import { PageContainer } from '@/components/page-container'
import { getAdminEnrollments, getAdminFeeTemplates, getAdminFinanceMovements, getAdminPayments } from '@/lib/admin-app'
import { AdminPaymentsClient } from './payments-client'

export default async function AdminPagosPage() {
  const [payments, financeMovements, enrollments, feeTemplates] = await Promise.all([
    getAdminPayments(),
    getAdminFinanceMovements(),
    getAdminEnrollments(),
    getAdminFeeTemplates(),
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
      />
    </PageContainer>
  )
}
