import { PageContainer } from '@/components/page-container'
import { PublicShell } from '@/components/public-shell'

export default function ClubPage() {
  return (
    <PublicShell>
      <PageContainer
        title="Club"
        description="Próximamente estará disponible esta sección."
        className="max-w-7xl"
      >
        <div className="rounded-2xl border border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur">
          <p className="text-base font-medium text-foreground">
            Estamos preparando la información del club.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            En esta sección se podrá consultar la historia, identidad y datos del CD Santiponce.
          </p>
        </div>
      </PageContainer>
    </PublicShell>
  )
}
