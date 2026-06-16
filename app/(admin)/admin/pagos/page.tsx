import { PageContainer } from '@/components/page-container'
import { getAdminFinanceMovements, getAdminPayments } from '@/lib/admin-app'
import { AdminPaymentsClient } from './payments-client'

export default async function AdminPagosPage() {
  const [payments, financeMovements] = await Promise.all([
    getAdminPayments(),
    getAdminFinanceMovements(),
  ])

  return (
    <PageContainer
      title="Pagos"
      description="Resumen financiero, histórico y seguimiento de operaciones registradas en la plataforma."
      className="max-w-7xl"
    >
      <AdminPaymentsClient payments={payments} financeMovements={financeMovements} />
    </PageContainer>
  )
}
