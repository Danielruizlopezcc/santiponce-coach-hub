import { PageContainer } from '@/components/page-container'
import { CLUB, MOCK_USER } from '@/lib/club'

export default function InicioPage() {
  return (
    <PageContainer
      title={`Hola, ${MOCK_USER.name}`}
      description={`Bienvenida al panel del ${CLUB.legalName}. Temporada ${CLUB.season}.`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-5 text-card-foreground">
          <h2 className="text-sm font-medium text-muted-foreground">
            Deportistas activos
          </h2>
          <p className="mt-2 text-3xl font-bold">2</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 text-card-foreground">
          <h2 className="text-sm font-medium text-muted-foreground">
            Matrículas pendientes
          </h2>
          <p className="mt-2 text-3xl font-bold">1</p>
        </article>
        <article className="rounded-xl border border-border bg-card p-5 text-card-foreground">
          <h2 className="text-sm font-medium text-muted-foreground">
            Temporada
          </h2>
          <p className="mt-2 text-3xl font-bold">{CLUB.season}</p>
        </article>
      </div>
    </PageContainer>
  )
}
