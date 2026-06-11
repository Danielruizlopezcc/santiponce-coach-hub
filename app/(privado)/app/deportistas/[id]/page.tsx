import { notFound } from 'next/navigation'
import { DeportistaEditorPage } from '@/components/deportista-editor-page'
import { PrivatePageContainer } from '@/components/private-page-container'
import { requireUser } from '@/lib/auth'
import { getPrivateAthleteById } from '@/lib/private-app'

export default async function DeportistaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser()
  const deportista = await getPrivateAthleteById(user.id, id)

  if (!deportista) {
    notFound()
  }

  return (
    <PrivatePageContainer
      title={`${deportista.nombre} ${deportista.apellidos}`}
      description="Edita la ficha del deportista asociado a tu cuenta."
    >
      <DeportistaEditorPage
        title="Editar deportista"
        description="Puedes actualizar la información del deportista, pero el equipo seguirá siendo de solo lectura."
        submitLabel="Guardar cambios"
        deportista={deportista}
      />
    </PrivatePageContainer>
  )
}
