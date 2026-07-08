import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPrivateTeamDetail } from '@/lib/private-app'
import type { PlayerPosition, PrivateTeamPlayer } from '@/lib/private-app-shared'

const POSITION_SECTIONS: Array<{
  key: PlayerPosition | 'unassigned'
  title: string
  singular: string
}> = [
  { key: 'goalkeeper', title: 'PORTEROS', singular: 'Portero' },
  { key: 'defender', title: 'DEFENSAS', singular: 'Defensa' },
  { key: 'midfielder', title: 'MEDIOCAMPISTAS', singular: 'Mediocampista' },
  { key: 'forward', title: 'DELANTEROS', singular: 'Delantero' },
  { key: 'unassigned', title: 'SIN POSICIÓN', singular: 'Jugador' },
]

const CARD_PATTERN = {
  backgroundImage:
    'radial-gradient(circle at 20% 12%, rgba(255,255,255,0.16) 0 1px, transparent 2px), linear-gradient(135deg, rgba(255,255,255,0.12) 0 12%, transparent 12% 24%, rgba(0,0,0,0.08) 24% 36%, transparent 36%), linear-gradient(180deg, #2f7ad8 0%, #154da0 52%, #04152f 100%)',
  backgroundSize: '28px 28px, 140px 140px, 100% 100%',
}

const HERO_PATTERN = {
  backgroundImage:
    'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.12) 0 1px, transparent 2px), linear-gradient(135deg, rgba(255,255,255,0.08) 0 14%, transparent 14% 28%, rgba(0,0,0,0.14) 28% 42%, transparent 42%), linear-gradient(120deg, #071c44 0%, #0b3474 54%, #061225 100%)',
  backgroundSize: '30px 30px, 160px 160px, 100% 100%',
}

type Props = { params: Promise<{ id: string }> }

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
}

function PlayerCard({
  player,
  positionLabel,
  index,
}: {
  player: PrivateTeamPlayer
  positionLabel: string
  index: number
}) {
  return (
    <article
      className="group relative h-[420px] w-[280px] shrink-0 overflow-hidden bg-primary shadow-sm transition-transform hover:-translate-y-1 md:w-[320px]"
      style={CARD_PATTERN}
    >
      <div className="absolute right-4 top-3 font-serif text-6xl font-black leading-none text-white">
        {player.shirtNumber ?? index + 1}
      </div>

      <div className="absolute inset-x-0 top-12 flex justify-center">
        <div className="flex size-44 items-center justify-center rounded-full bg-white/18 text-6xl font-black text-white ring-1 ring-white/25 md:size-52">
          {getInitials(player.nombre)}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-5 pt-28">
        <p className="text-sm font-bold text-white/90">{positionLabel}</p>
        <h3 className="mt-1 font-serif text-3xl font-black uppercase leading-none text-white">
          {player.nombre}
        </h3>
      </div>
    </article>
  )
}

export default async function PrivateEquipoDetailPage({ params }: Props) {
  const { id } = await params
  const team = await getPrivateTeamDetail(id)

  if (!team) notFound()

  const visibleSections = POSITION_SECTIONS.map((section) => {
    const players = team.players.filter((player) =>
      section.key === 'unassigned'
        ? !player.position
        : player.position === section.key,
    )
    return { ...section, players }
  }).filter((section) => section.players.length > 0 || section.key !== 'unassigned')

  return (
    <div className="relative min-h-[calc(100svh-9rem)] bg-background">
      <div>
      <section className="relative overflow-hidden bg-[#071c44] text-white">
          <div className="absolute inset-0" style={HERO_PATTERN} aria-hidden="true" />
          <div className="relative mx-auto flex min-h-56 w-full max-w-7xl flex-col justify-center px-4 py-10 md:px-8 md:py-16">
            <Button variant="ghost" size="sm" asChild className="mb-8 w-fit gap-1.5 text-white/80 hover:bg-white/10 hover:text-white">
              <Link href="/app">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Inicio
              </Link>
            </Button>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-white/70">
              {team.categoria} · {team.temporada}
            </p>
            <h1 className="mt-4 font-serif text-5xl font-black uppercase leading-none text-white md:text-7xl">
              {team.nombre}
            </h1>
          </div>
      </section>

      <div className="border-b border-border bg-background">
          <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 md:px-8">
            <span className="border-b-2 border-primary py-5 text-sm font-bold text-primary">
              Equipo
            </span>
            <span className="py-5 text-sm font-semibold text-muted-foreground">
              {team.jugadores} jugador{team.jugadores !== 1 ? 'es' : ''}
            </span>
          </div>
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-16 px-4 py-12 md:px-8">
          {team.players.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <p className="text-base font-semibold text-foreground">Este equipo aún no tiene jugadores asignados.</p>
            </div>
          ) : (
            <>
              {visibleSections.map((section) => (
                <section key={section.key}>
                  <div className="mb-8 flex items-center justify-between gap-4">
                    <h2 className="font-serif text-4xl font-black uppercase text-foreground md:text-5xl">
                      {section.title}
                    </h2>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {section.players.length}
                    </span>
                  </div>

                  {section.players.length === 0 ? (
                    <p className="rounded-xl border border-border bg-muted/40 px-4 py-8 text-sm text-muted-foreground">
                      No hay jugadores en esta posición.
                    </p>
                  ) : (
                    <div className="-mx-4 overflow-x-auto px-4 pb-3">
                      <div className="flex gap-6">
                        {section.players.map((player, index) => (
                          <PlayerCard
                            key={player.id}
                            player={player}
                            positionLabel={section.singular}
                            index={index}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </>
          )}
      </div>
      </div>
    </div>
  )
}
