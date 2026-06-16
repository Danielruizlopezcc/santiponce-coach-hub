import { PageContainer } from '@/components/page-container'
import { PublicShell } from '@/components/public-shell'

export default function CalendarioPage() {
  return (
    <PublicShell>
      <PageContainer
        title="Calendario"
        description="Próximamente estará disponible esta sección."
        className="max-w-7xl"
      >
        <div className="rounded-2xl border border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur">
          <p className="text-base font-medium text-foreground">
            Estamos preparando el calendario del club.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            En esta sección aparecerán partidos, eventos y fechas importantes de la temporada.
          </p>
        </div>
      </PageContainer>
    </PublicShell>
  )
}
