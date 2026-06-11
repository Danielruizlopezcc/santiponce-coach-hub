import Link from 'next/link'
import { ArrowRight, ClipboardList, UserCheck, UserPlus, Users } from 'lucide-react'
import { ClubLogo } from '@/components/club-logo'
import { PageContainer } from '@/components/page-container'
import { Button } from '@/components/ui/button'
import { CLUB, MOCK_USER } from '@/lib/club'
import { cn } from '@/lib/utils'

type Deportista = {
  id: number
  nombre: string
  categoria: string
  equipo: string
  matriculado: boolean
}

const DEPORTISTAS_MOCK: Deportista[] = [
  { id: 1, nombre: 'Lucía García', categoria: 'Alevín', equipo: 'Alevín A', matriculado: true },
  { id: 2, nombre: 'Marcos García', categoria: 'Cadete', equipo: 'Cadete B', matriculado: false },
  { id: 3, nombre: 'Daniela García', categoria: 'Benjamín', equipo: 'Benjamín A', matriculado: true },
]

const IMPORTE_MATRICULA = 50

const importeFormateado = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
}).format(IMPORTE_MATRICULA)

function LightBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl motion-safe:animate-blob-slow" />
      <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-chart-2/15 blur-3xl motion-safe:animate-blob" />
      <div className="absolute bottom-[-10%] left-1/3 h-72 w-72 rounded-full bg-chart-3/15 blur-3xl motion-safe:animate-blob-slow" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_60%,var(--background)_100%)]" />
    </div>
  )
}

type ResumenCardProps = {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accent?: string
}

function ResumenCard({ label, value, icon: Icon, accent = 'bg-primary/10 text-primary' }: ResumenCardProps) {
  return (
    <article className="flex items-center gap-4 rounded-xl border border-border bg-card/80 p-5 text-card-foreground shadow-sm backdrop-blur">
      <span className={cn('flex size-11 items-center justify-center rounded-lg', accent)}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-2xl font-bold leading-tight text-foreground">{value}</p>
      </div>
    </article>
  )
}

export default function AppDashboardPage() {
  const deportistas = DEPORTISTAS_MOCK
  const total = deportistas.length
  const matriculados = deportistas.filter((d) => d.matriculado).length
  const pendientes = total - matriculados

  return (
    <div className="relative">
      <LightBackground />
      <PageContainer
        title={`Hola, ${MOCK_USER.name}`}
        description={`Este es el panel del ${CLUB.legalName}. Temporada activa ${CLUB.season}.`}
      >
        <section
          aria-label="Club"
          className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur"
        >
          <ClubLogo size={52} href="" />
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            Temporada activa {CLUB.season}
          </span>
        </section>

        <section aria-label="Resumen" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ResumenCard label="Total de deportistas" value={String(total)} icon={Users} />
          <ResumenCard
            label="Pendientes de matrícula"
            value={String(pendientes)}
            icon={UserPlus}
            accent="bg-chart-4/15 text-chart-4"
          />
          <ResumenCard
            label="Matriculados"
            value={String(matriculados)}
            icon={UserCheck}
            accent="bg-chart-2/20 text-chart-2"
          />
          <ResumenCard
            label="Importe de matrícula"
            value={importeFormateado}
            icon={ClipboardList}
            accent="bg-chart-3/20 text-chart-3"
          />
        </section>

        <section
          aria-label="Matriculación"
          className="mt-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-card p-6 shadow-sm backdrop-blur sm:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Acceso destacado
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground md:text-2xl">
                Matriculación temporada {CLUB.season}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                {pendientes > 0
                  ? `Tienes ${pendientes} ${pendientes === 1 ? 'deportista pendiente' : 'deportistas pendientes'} de matricular. Importe por deportista: ${importeFormateado}.`
                  : `Todos tus deportistas están al día. Importe por deportista: ${importeFormateado}.`}
              </p>
            </div>
            <Button render={<Link href="/matriculacion" />} size="lg">
              Ir a matriculación
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </section>

        <section aria-label="Tus deportistas" className="mt-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Tus deportistas</h2>
              <p className="text-sm text-muted-foreground">
                Resumen breve de los deportistas vinculados a tu cuenta.
              </p>
            </div>
            <Link
              href="/mis-deportistas"
              className="text-sm font-medium text-primary outline-none hover:underline focus-visible:underline"
            >
              Ver todos
            </Link>
          </div>

          {total === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/70 p-8 text-center text-card-foreground backdrop-blur">
              <p className="text-base font-medium">Aún no tienes deportistas.</p>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                Cuando añadas deportistas a tu cuenta, aparecerán aquí.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {deportistas.slice(0, 4).map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/80 p-4 text-card-foreground shadow-sm backdrop-blur"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {d.categoria} · {d.equipo}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
                      d.matriculado
                        ? 'bg-chart-2/15 text-chart-2'
                        : 'bg-chart-4/15 text-chart-4',
                    )}
                  >
                    {d.matriculado ? 'Matriculado' : 'Pendiente'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageContainer>
    </div>
  )
}