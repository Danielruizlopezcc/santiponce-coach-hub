import Link from 'next/link'
import { ArrowRight, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrivatePageContainer } from '@/components/private-page-container'
import { requireUser } from '@/lib/auth'
import { getPrivateTeams, getPrivateUserStatus } from '@/lib/private-app'
import { cn } from '@/lib/utils'

const TEAM_ESTADO_STYLES = {
  Abierto: 'bg-emerald-100 text-emerald-700',
  Completo: 'bg-blue-100 text-blue-700',
  Pendiente: 'bg-amber-100 text-amber-700',
} as const

export default async function PrivateEquiposPage() {
  const user = await requireUser()
  const [status, teams] = await Promise.all([
    getPrivateUserStatus(user.id),
    getPrivateTeams(),
  ])
  const isLocked = status.isSocio && !status.isPaidSocio

  return (
    <PrivatePageContainer
      title="Equipos"
      description="Consulta los equipos del club y sus jugadores."
    >
      <div className="relative">
        {teams.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur">
            <p className="text-base font-medium text-foreground">Aún no hay equipos disponibles.</p>
            <p className="mt-2 text-sm text-muted-foreground">Cuando el club configure equipos, aparecerán aquí.</p>
          </div>
        ) : (
          <ul
            className={cn(
              'grid gap-4 sm:grid-cols-2 xl:grid-cols-3',
              isLocked && 'pointer-events-none blur-sm grayscale',
            )}
          >
            {teams.map((team) => (
              <li
                key={team.id}
                className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur transition-colors hover:border-primary/30"
              >
                <Link href={`/app/equipos/${team.id}`} className="block p-5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Shield className="size-5" aria-hidden="true" />
                    </span>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', TEAM_ESTADO_STYLES[team.estado])}>
                      {team.estado}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{team.nombre}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {team.categoria} · {team.temporada}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="size-4" aria-hidden="true" />
                      {team.jugadores} jugador{team.jugadores !== 1 ? 'es' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-primary">
                      Ver equipo
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[32px] bg-background/80 p-8 text-center shadow-lg">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Acceso restringido
            </span>
            <h2 className="max-w-xl text-2xl font-semibold text-foreground">
              Necesitas pagar la cuota de socio para ver los equipos.
            </h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              La sección de equipos está disponible para tutores y para socios con cuota pagada. Pulsa el botón para completar tu membresía de 20€.
            </p>
            <Button nativeButton={false} render={<Link href="/app/pago-socio" />} size="lg">
              Ir a pago de socio
            </Button>
          </div>
        )}
      </div>
    </PrivatePageContainer>
  )
}
