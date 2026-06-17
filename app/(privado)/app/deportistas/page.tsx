import { PrivatePageContainer } from '@/components/private-page-container'
import { DeportistasOverview } from '@/components/deportistas-overview'
import { requireUser } from '@/lib/auth'
import { getPrivateAthletes, getPrivateUserStatus } from '@/lib/private-app'

export default async function DeportistasPage() {
  const user = await requireUser()
  const [status, deportistas] = await Promise.all([
    getPrivateUserStatus(user.id),
    getPrivateAthletes(user.id),
  ])

  return (
    <PrivatePageContainer
      title="Mis deportistas"
      description="Gestiona las fichas deportivas asociadas a tu cuenta."
    >
      {status.hasGuardian && !status.isGuardianApproved ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <p className="font-bold">Cuenta pendiente de aprobación</p>
          <p className="mt-1 text-sm">Un administrador debe aprobar tu cuenta antes de gestionar deportistas.</p>
        </div>
      ) : (
        <DeportistasOverview deportistas={deportistas} />
      )}
    </PrivatePageContainer>
  )
}
