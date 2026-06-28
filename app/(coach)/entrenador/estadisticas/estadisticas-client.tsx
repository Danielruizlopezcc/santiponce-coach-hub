'use client'

import { useMemo, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { CLUB } from '@/lib/club'
import type { AdminMatchRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'

type Props = {
  matches: AdminMatchRow[]
}

type StatKey =
  | 'possession'
  | 'offsides'
  | 'corners'
  | 'totalShots'
  | 'shots'
  | 'shotsOnTarget'
  | 'blockedShots'
  | 'goalkeeperSaves'
  | 'tackles'
  | 'fouls'
  | 'yellowCards'
  | 'redCards'

type StatDefinition = {
  key: StatKey
  label: string
  section: string
  aggregate: 'sum' | 'average'
}

const STATS: StatDefinition[] = [
  { key: 'possession', label: 'Posesión', section: 'Estadísticas generales', aggregate: 'average' },
  { key: 'offsides', label: 'Fueras de juego', section: 'Estadísticas generales', aggregate: 'sum' },
  { key: 'corners', label: 'Saques de esquina', section: 'Estadísticas generales', aggregate: 'sum' },
  { key: 'totalShots', label: 'Disparos totales', section: 'Ataque', aggregate: 'sum' },
  { key: 'shots', label: 'Tiros', section: 'Ataque', aggregate: 'sum' },
  { key: 'shotsOnTarget', label: 'Tiros a puerta', section: 'Ataque', aggregate: 'sum' },
  { key: 'blockedShots', label: 'Disparos bloqueados', section: 'Ataque', aggregate: 'sum' },
  { key: 'goalkeeperSaves', label: 'Paradas del portero', section: 'Defensa', aggregate: 'sum' },
  { key: 'tackles', label: 'Recuperaciones', section: 'Defensa', aggregate: 'sum' },
  { key: 'fouls', label: 'Faltas', section: 'Disciplina', aggregate: 'sum' },
  { key: 'yellowCards', label: 'Tarjetas amarillas', section: 'Disciplina', aggregate: 'sum' },
  { key: 'redCards', label: 'Tarjetas rojas', section: 'Disciplina', aggregate: 'sum' },
]

const SECTIONS = Array.from(new Set(STATS.map((stat) => stat.section)))

function getClubScore(match: AdminMatchRow) {
  return match.isHome ? match.homeScore : match.awayScore
}

function getOpponentScore(match: AdminMatchRow) {
  return match.isHome ? match.awayScore : match.homeScore
}

function getStatValue(match: AdminMatchRow, key: StatKey, side: 'club' | 'opponent') {
  const homeKey = `home${key[0].toUpperCase()}${key.slice(1)}` as keyof AdminMatchRow
  const awayKey = `away${key[0].toUpperCase()}${key.slice(1)}` as keyof AdminMatchRow
  const value = match.isHome === (side === 'club') ? match[homeKey] : match[awayKey]
  return typeof value === 'number' ? value : null
}

function formatValue(value: number | null, suffix = '') {
  return value === null ? '-' : `${value}${suffix}`
}

function getWidths(left: number | null, right: number | null) {
  const leftValue = left ?? 0
  const rightValue = right ?? 0
  const total = leftValue + rightValue

  if (total === 0) return { left: 50, right: 50 }

  return {
    left: Math.max(6, Math.round((leftValue / total) * 100)),
    right: Math.max(6, Math.round((rightValue / total) * 100)),
  }
}

function aggregateStat(matches: AdminMatchRow[], stat: StatDefinition, side: 'club' | 'opponent') {
  const values = matches
    .map((match) => getStatValue(match, stat.key, side))
    .filter((value): value is number => typeof value === 'number')

  if (values.length === 0) return null

  if (stat.aggregate === 'average') {
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
  }

  return values.reduce((sum, value) => sum + value, 0)
}

function StatRow({
  label,
  clubValue,
  opponentValue,
  suffix = '',
}: {
  label: string
  clubValue: number | null
  opponentValue: number | null
  suffix?: string
}) {
  const widths = getWidths(clubValue, opponentValue)

  return (
    <div className="border-t border-border py-3 first:border-t-0">
      <div className="grid grid-cols-[88px_1fr_88px] items-center gap-3">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-center text-xs font-black text-emerald-800">
          {formatValue(clubValue, suffix)}
        </span>
        <span className="text-center text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-center text-xs font-black text-sky-800">
          {formatValue(opponentValue, suffix)}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="ml-auto h-full rounded-full bg-emerald-400" style={{ width: `${widths.left}%` }} />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-sky-400" style={{ width: `${widths.right}%` }} />
        </div>
      </div>
    </div>
  )
}

export function CoachStatsClient({ matches }: Props) {
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id ?? '')
  const selectedMatch = matches.find((match) => match.id === selectedMatchId) ?? matches[0] ?? null

  const summary = useMemo(() => {
    const played = matches.filter((match) => match.status === 'played' && getClubScore(match) !== null && getOpponentScore(match) !== null)
    const wins = played.filter((match) => (getClubScore(match) ?? 0) > (getOpponentScore(match) ?? 0)).length
    const draws = played.filter((match) => getClubScore(match) === getOpponentScore(match)).length
    const losses = played.filter((match) => (getClubScore(match) ?? 0) < (getOpponentScore(match) ?? 0)).length
    const goalsFor = played.reduce((total, match) => total + (getClubScore(match) ?? 0), 0)
    const goalsAgainst = played.reduce((total, match) => total + (getOpponentScore(match) ?? 0), 0)

    return { played: played.length, wins, draws, losses, goalsFor, goalsAgainst }
  }, [matches])

  if (matches.length === 0) {
    return (
      <div className="rounded-xl bg-white/80 p-10 text-center shadow-sm ring-1 ring-foreground/10">
        <BarChart3 className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-muted-foreground">No hay partidos para calcular estadísticas.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-5">
        {[
          ['Partidos jugados', summary.played],
          ['Victorias', summary.wins],
          ['Empates', summary.draws],
          ['Derrotas', summary.losses],
          ['Goles', `${summary.goalsFor} - ${summary.goalsAgainst}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white/85 px-4 py-3 shadow-sm ring-1 ring-foreground/10">
            <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl bg-white/85 p-4 shadow-sm ring-1 ring-foreground/10">
        <h2 className="text-sm font-black uppercase text-foreground">Resumen de todos los partidos</h2>
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {SECTIONS.map((section) => (
            <div key={section} className="rounded-lg border border-border bg-white px-4 py-3">
              <h3 className="mb-1 text-center text-xs font-black uppercase text-foreground">{section}</h3>
              {STATS.filter((stat) => stat.section === section).map((stat) => (
                <StatRow
                  key={stat.key}
                  label={stat.label}
                  clubValue={aggregateStat(matches, stat, 'club')}
                  opponentValue={aggregateStat(matches, stat, 'opponent')}
                  suffix={stat.key === 'possession' ? '%' : ''}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-white/85 p-4 shadow-sm ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase text-foreground">Partido concreto</h2>
          <select
            value={selectedMatch?.id ?? ''}
            onChange={(event) => setSelectedMatchId(event.target.value)}
            className="h-9 min-w-72 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {matches.map((match) => (
              <option key={match.id} value={match.id}>
                {match.dateLabel} · {match.isHome ? CLUB.shortName : match.opponentName} vs {match.isHome ? match.opponentName : CLUB.shortName}
              </option>
            ))}
          </select>
        </div>

        {selectedMatch ? (
          <div className="mt-4 rounded-lg border border-border bg-white">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border px-4 py-4">
              <div className="text-right text-sm font-black">{CLUB.shortName}</div>
              <div className="rounded-lg bg-muted px-4 py-2 text-2xl font-black">
                {formatValue(getClubScore(selectedMatch))} - {formatValue(getOpponentScore(selectedMatch))}
              </div>
              <div className="text-sm font-black">{selectedMatch.opponentName}</div>
            </div>
            <div className="grid gap-5 p-4 lg:grid-cols-2">
              {SECTIONS.map((section) => (
                <div key={section} className="rounded-lg border border-border px-4 py-3">
                  <h3 className="mb-1 text-center text-xs font-black uppercase text-foreground">{section}</h3>
                  {STATS.filter((stat) => stat.section === section).map((stat) => (
                    <StatRow
                      key={stat.key}
                      label={stat.label}
                      clubValue={getStatValue(selectedMatch, stat.key, 'club')}
                      opponentValue={getStatValue(selectedMatch, stat.key, 'opponent')}
                      suffix={stat.key === 'possession' ? '%' : ''}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
