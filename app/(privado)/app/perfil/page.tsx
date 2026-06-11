import { PrivatePageContainer } from '@/components/private-page-container'
import { TutorProfileForm } from '@/components/tutor-profile-form'

export default function PerfilPage() {
  return (
    <PrivatePageContainer
      title="Perfil"
      description="Consulta y gestiona los datos del tutor responsable."
    >
      <TutorProfileForm />
    </PrivatePageContainer>
  )
}
