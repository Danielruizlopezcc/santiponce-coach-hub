import { MatriculacionPanel } from '@/components/matriculacion-panel'
import { PrivatePageContainer } from '@/components/private-page-container'
import { requireUser } from '@/lib/auth'
import { getPrivateAthletes, getPrivateDashboardData } from '@/lib/private-app'

export default async function MatriculacionPage() {
  const user = await requireUser()
  const [{ seasonLabel, matriculaImporte, isGuardianApproved }, deportistas] = await Promise.all([
    getPrivateDashboardData(user.id),
    getPrivateAthletes(user.id),
  ])

  return (
    <PrivatePageContainer
      title="Matriculación"
      description="Gestiona la matrícula individual de cada deportista."
    >
      {!isGuardianApproved ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <p className="font-bold">Cuenta pendiente de aprobación</p>
          <p className="mt-1 text-sm">Un administrador debe aprobar tu cuenta antes de iniciar matriculaciones.</p>
        </div>
      ) : (
        <MatriculacionPanel
          temporada={seasonLabel}
          importe={matriculaImporte}
          deportistas={deportistas}
        />
      )}
    </PrivatePageContainer>
  )
}
