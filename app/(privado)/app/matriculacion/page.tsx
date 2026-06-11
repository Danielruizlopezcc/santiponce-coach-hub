import { MatriculacionPanel } from '@/components/matriculacion-panel'
import { PrivatePageContainer } from '@/components/private-page-container'

export default function MatriculacionPage() {
  return (
    <PrivatePageContainer
      title="Matriculación"
      description="Gestiona la matrícula individual de cada deportista."
    >
      <MatriculacionPanel />
    </PrivatePageContainer>
  )
}
