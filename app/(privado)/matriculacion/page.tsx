import { PageContainer } from '@/components/page-container'
import { CLUB } from '@/lib/club'

export default function MatriculacionPage() {
  return (
    <PageContainer
      title="Matriculación"
      description={`Gestiona las inscripciones para la temporada ${CLUB.season}.`}
    >
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-card-foreground">
        <p className="text-base font-medium">
          No hay matrículas abiertas en este momento.
        </p>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">
          Cuando se abra el periodo de inscripción, podrás matricular a tus
          deportistas desde aquí.
        </p>
      </div>
    </PageContainer>
  )
}
