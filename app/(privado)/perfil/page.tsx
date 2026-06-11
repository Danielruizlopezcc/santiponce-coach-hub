import { PageContainer } from '@/components/page-container'
import { MOCK_USER } from '@/lib/club'

export default function PerfilPage() {
  return (
    <PageContainer
      title="Perfil"
      description="Consulta y gestiona los datos de tu cuenta."
    >
      <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
        <div className="bg-card p-5">
          <dt className="text-sm text-muted-foreground">Titular de la cuenta</dt>
          <dd className="mt-1 font-medium text-card-foreground">
            {MOCK_USER.name}
          </dd>
        </div>
        <div className="bg-card p-5">
          <dt className="text-sm text-muted-foreground">Correo electrónico</dt>
          <dd className="mt-1 font-medium text-card-foreground">
            {MOCK_USER.email}
          </dd>
        </div>
      </dl>
    </PageContainer>
  )
}
