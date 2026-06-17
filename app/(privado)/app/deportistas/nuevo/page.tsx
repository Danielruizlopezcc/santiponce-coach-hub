import { PrivatePageContainer } from '@/components/private-page-container'
import { DeportistaEditorPage } from '@/components/deportista-editor-page'
import { requireUser } from '@/lib/auth'
import { getPrivateUserStatus } from '@/lib/private-app'

export default async function NuevoDeportistaPage() {
  const user = await requireUser()
  const status = await getPrivateUserStatus(user.id)

  return (
    <PrivatePageContainer
      title="Nuevo deportista"
      description="Crea una ficha deportiva nueva vinculada a tu cuenta."
    >
      {status.hasGuardian && !status.isGuardianApproved ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          <p className="font-bold">Cuenta pendiente de aprobación</p>
          <p className="mt-1 text-sm">Un administrador debe aprobar tu cuenta antes de crear deportistas.</p>
        </div>
      ) : (
        <DeportistaEditorPage
          title="Alta de deportista"
          description="Completa los datos del deportista. El equipo será asignado más adelante desde administración."
          submitLabel="Guardar deportista"
        />
      )}
    </PrivatePageContainer>
  )
}
