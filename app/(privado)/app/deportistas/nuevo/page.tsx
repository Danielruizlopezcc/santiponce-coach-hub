import { PrivatePageContainer } from '@/components/private-page-container'
import { DeportistaEditorPage } from '@/components/deportista-editor-page'

export default function NuevoDeportistaPage() {
  return (
    <PrivatePageContainer
      title="Nuevo deportista"
      description="Crea una ficha deportiva visual para la temporada activa."
    >
      <DeportistaEditorPage
        title="Alta de deportista"
        description="Completa los datos del deportista. El equipo será asignado más adelante desde administración."
        submitLabel="Guardar deportista"
      />
    </PrivatePageContainer>
  )
}
