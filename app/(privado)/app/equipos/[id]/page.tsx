import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PrivatePageContainer } from '@/components/private-page-container'
import { requireUser } from '@/lib/auth'
import { getPrivateTeamDetail, getPrivateUserStatus } from '@/lib/private-app'
import { cn } from '@/lib/utils'

const MATRICULA_STYLES = {
  Matriculado: 'bg-emerald-100 text-emerald-700',
  'En revisión': 'bg-blue-100 text-blue-700',
  Pendiente: 'bg-amber-100 text-amber-700',
} as const

const TEAM_ESTADO_STYLES = {
  Abierto: 'bg-emerald-100 text-emerald-700',
  Completo: 'bg-blue-100 text-blue-700',
  Pendiente: 'bg-amber-100 text-amber-700',
} as const

type Props = { params: Promise<{ id: string }> }

export default async function PrivateEquipoDetailPage({ params }: Props) {
  const user = await requireUser()
  const { id } = await params
  const [status, team] = await Promise.all([
    getPrivateUserStatus(user.id),
    getPrivateTeamDetail(id),
  ])

  if (!team) notFound()

  const isLocked = status.isSocio && !status.isPaidSocio

  return (
    <PrivatePageContainer
      title={team.nombre}
      description={`${team.categoria} · ${team.temporada}`}
    >
      <div className="relative">
        <div className={cn('space-y-6', isLocked && 'pointer-events-none blur-sm grayscale')}>
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href="/app/equipos">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Equipos
            </Link>
          </Button>

          <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Shield className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-foreground">{team.nombre}</h2>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', TEAM_ESTADO_STYLES[team.estado])}>
                      {team.estado}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {team.categoria} · {team.temporada}
                  </p>
                  {team.notes && (
                    <p className="mt-3 max-w-2xl text-sm italic text-muted-foreground">{team.notes}</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-muted/70 px-4 py-3 text-right">
                <p className="text-xs text-muted-foreground">Jugadores</p>
                <p className="text-2xl font-bold text-foreground">{team.jugadores}</p>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-base font-semibold text-foreground">Jugadores del equipo</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {team.players.length}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-card/80 shadow-sm backdrop-blur">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Jugador</th>
                    <th className="hidden px-4 py-2.5 text-left text-xs font-medium text-muted-foreground sm:table-cell">Categoría</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Matrícula</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {team.players.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        Este equipo aún no tiene jugadores asignados.
                      </td>
                    </tr>
                  )}
                  {team.players.map((player) => (
                    <tr key={player.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{player.nombre}</td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{player.categoriaSolicitada}</td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', MATRICULA_STYLES[player.estadoMatricula])}>
                          {player.estadoMatricula}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[32px] bg-background/80 p-8 text-center shadow-lg">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              Acceso restringido
            </span>
            <h2 className="max-w-xl text-2xl font-semibold text-foreground">
              Necesitas pagar la cuota de socio para ver este equipo.
            </h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Los datos de equipos y jugadores están disponibles para tutores y para socios con cuota pagada.
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
