import { notFound } from 'next/navigation'
import { DeportistaEditorPage } from '@/components/deportista-editor-page'
import { PrivatePageContainer } from '@/components/private-page-container'
import { requireUser } from '@/lib/auth'
import { getPrivateAthleteById, getPrivateUserStatus } from '@/lib/private-app'

export default async function DeportistaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const [status, deportista] = await Promise.all([
    getPrivateUserStatus(user.id),
    getPrivateAthleteById(user.id, id),
  ])

  if (!deportista) {
    notFound()
  }

  return (
    <PrivatePageContainer
      title={`${deportista.nombre} ${deportista.apellidos}`}
      description="Edita la ficha del deportista asociado a tu cuenta."
    >
      {status.hasGuardian && !status.isGuardianApproved ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <p className="font-bold">Cuenta pendiente de aprobación</p>
          <p className="mt-1 text-sm">Un administrador debe aprobar tu cuenta antes de editar deportistas.</p>
        </div>
      ) : (
        <DeportistaEditorPage
          title="Editar deportista"
          description="Puedes actualizar la información del deportista, pero el equipo seguirá siendo de solo lectura."
          submitLabel="Guardar cambios"
          deportista={deportista}
        />
      )}
    </PrivatePageContainer>
  )
}
