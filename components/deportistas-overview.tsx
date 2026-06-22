import Link from 'next/link'
import { Edit3, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatSpanishDate } from '@/lib/format'
import { type PrivateAthleteDetail } from '@/lib/private-app-shared'
import { cn } from '@/lib/utils'

const estadoStyles = {
  pendiente: 'bg-amber-100 text-amber-700',
  matriculado: 'bg-emerald-100 text-emerald-700',
  en_revision: 'bg-blue-100 text-blue-700',
} as const

const pagoStyles = {
  pagado: 'bg-emerald-100 text-emerald-700',
  pendiente: 'bg-slate-100 text-slate-700',
} as const

type DeportistasOverviewProps = {
  deportistas: PrivateAthleteDetail[]
}

export function DeportistasOverview({ deportistas }: DeportistasOverviewProps) {
  if (deportistas.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/70 p-8 text-center">
        <p className="text-base font-medium text-foreground">Aún no tienes deportistas registrados.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Añade un deportista para empezar con la matriculación de la temporada.
        </p>
        <Button
          nativeButton={false}
          render={<Link href="/app/deportistas/nuevo" />}
          className="mt-4"
        >
          <Plus className="size-4" aria-hidden="true" />
          Añadir deportista
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {deportistas.length} deportistas vinculados
        </span>
        <Button nativeButton={false} render={<Link href="/app/deportistas/nuevo" />}>
          <Plus className="size-4" aria-hidden="true" />
          Nuevo deportista
        </Button>
      </div>

      <div className="grid gap-4">
        {deportistas.map((deportista) => (
          <article
            key={deportista.id}
            className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {deportista.nombre} {deportista.apellidos}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Fecha de nacimiento: {formatSpanishDate(deportista.fechaNacimiento)}
                  </p>
                </div>

                <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <dt className="text-muted-foreground">Categoría solicitada</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {deportista.categoriaSolicitada}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <dt className="text-muted-foreground">Equipo asignado</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {deportista.equipoAsignado ?? 'Sin equipo asignado'}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <dt className="text-muted-foreground">Temporada</dt>
                    <dd className="mt-1 font-medium text-foreground">{deportista.temporada}</dd>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <dt className="text-muted-foreground">Estado de pago</dt>
                    <dd className="mt-1">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                          pagoStyles[deportista.pagoEstado],
                        )}
                      >
                        {deportista.pagoEstado === 'pagado' ? 'Pagada' : 'Pendiente'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                    estadoStyles[deportista.estado],
                  )}
                >
                  {deportista.estado === 'en_revision'
                    ? 'En revisión'
                    : deportista.estado === 'matriculado'
                      ? 'Matriculado'
                      : 'Pendiente'}
                </span>
                <Button
                  nativeButton={false}
                  variant="outline"
                  render={<Link href={`/app/deportistas/${deportista.id}`} />}
                >
                  <Edit3 className="size-4" aria-hidden="true" />
                  Editar
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
