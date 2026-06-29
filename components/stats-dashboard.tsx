'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { BarChart3, GitCompare, ListFilter, Medal, Shield, Users } from 'lucide-react'
import { CLUB } from '@/lib/club'
import type { AdminMatchPlayerStat, AdminMatchRow, AdminTeamRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'

type StatsDashboardProps = {
  matches: AdminMatchRow[]
  teams: AdminTeamRow[]
  scope: 'coach' | 'admin'
}

type TabKey = 'summary' | 'players' | 'matches' | 'compare'
type LocationFilter = 'all' | 'home' | 'away'
type MatchTypeFilter = 'all' | AdminMatchRow['matchType']
type MatchPlayerPositionFilter = 'all' | 'goalkeeper' | 'defender' | 'midfielder' | 'forward' | 'none'
type MatchPlayerStarterFilter = 'all' | 'starters' | 'substitutes'
type MatchPlayerSortKey = 'shirtNumber' | 'athleteName' | 'minutes' | 'goals' | 'assists' | 'shots' | 'saves' | 'yellowCards' | 'redCards'
type StatSide = 'club' | 'opponent'

type TeamStatKey =
  | 'possession'
  | 'offsides'
  | 'corners'
  | 'totalShots'
  | 'shotsOnTarget'
  | 'blockedShots'
  | 'goalkeeperSaves'
  | 'tackles'
  | 'fouls'
  | 'yellowCards'
  | 'redCards'

type TeamStatDefinition = {
  key: TeamStatKey
  label: string
  group: string
  aggregate: 'sum' | 'average'
  suffix?: string
}

type PlayerMetricKey =
  | 'callups'
  | 'starts'
  | 'minutes'
  | 'goals'
  | 'assists'
  | 'shots'
  | 'saves'
  | 'yellowCards'
  | 'redCards'
  | 'foulsCommitted'
  | 'foulsReceived'

type PlayerSummary = {
  athleteId: string
  athleteName: string
  teamId: string
  teamName: string
  position: AdminMatchPlayerStat['position']
  callups: number
  starts: number
  minutes: number
  goals: number
  assists: number
  shots: number
  saves: number
  yellowCards: number
  redCards: number
  foulsCommitted: number
  foulsReceived: number
  matchRows: Array<{ match: AdminMatchRow; stat: AdminMatchPlayerStat }>
}

const TABS: Array<{ key: TabKey; label: string; icon: typeof BarChart3 }> = [
  { key: 'summary', label: 'Resumen', icon: BarChart3 },
  { key: 'players', label: 'Jugadores', icon: Users },
  { key: 'matches', label: 'Partidos', icon: Shield },
  { key: 'compare', label: 'Comparativas', icon: GitCompare },
]

const TEAM_STATS: TeamStatDefinition[] = [
  { key: 'possession', label: 'Posesión media', group: 'Control', aggregate: 'average', suffix: '%' },
  { key: 'corners', label: 'Corners', group: 'Control', aggregate: 'sum' },
  { key: 'offsides', label: 'Fueras de juego', group: 'Control', aggregate: 'sum' },
  { key: 'totalShots', label: 'Disparos totales', group: 'Ataque', aggregate: 'sum' },
  { key: 'shotsOnTarget', label: 'Tiros a puerta', group: 'Ataque', aggregate: 'sum' },
  { key: 'blockedShots', label: 'Disparos bloqueados', group: 'Ataque', aggregate: 'sum' },
  { key: 'goalkeeperSaves', label: 'Paradas', group: 'Defensa', aggregate: 'sum' },
  { key: 'tackles', label: 'Recuperaciones', group: 'Defensa', aggregate: 'sum' },
  { key: 'fouls', label: 'Faltas', group: 'Disciplina', aggregate: 'sum' },
  { key: 'yellowCards', label: 'Amarillas', group: 'Disciplina', aggregate: 'sum' },
  { key: 'redCards', label: 'Rojas', group: 'Disciplina', aggregate: 'sum' },
]

const PLAYER_METRICS: Array<{ key: PlayerMetricKey; label: string }> = [
  { key: 'goals', label: 'Goles' },
  { key: 'assists', label: 'Asistencias' },
  { key: 'minutes', label: 'Minutos' },
  { key: 'callups', label: 'Convocatorias' },
  { key: 'starts', label: 'Titularidades' },
  { key: 'shots', label: 'Tiros' },
  { key: 'saves', label: 'Paradas' },
  { key: 'yellowCards', label: 'Amarillas' },
  { key: 'redCards', label: 'Rojas' },
]

const MATCH_PLAYER_SORT_OPTIONS: Array<{ key: MatchPlayerSortKey; label: string }> = [
  { key: 'shirtNumber', label: 'Dorsal' },
  { key: 'athleteName', label: 'Nombre' },
  { key: 'minutes', label: 'Minutos' },
  { key: 'goals', label: 'Goles' },
  { key: 'assists', label: 'Asistencias' },
  { key: 'shots', label: 'Tiros' },
  { key: 'saves', label: 'Paradas' },
  { key: 'yellowCards', label: 'Amarillas' },
  { key: 'redCards', label: 'Rojas' },
]

const MATCH_PLAYER_STAT_COLUMNS: Array<{
  key: keyof Pick<
    AdminMatchPlayerStat,
    'goals' | 'assists' | 'shots' | 'saves' | 'foulsCommitted' | 'foulsReceived' | 'yellowCards' | 'redCards'
  >
  label: string
}> = [
  { key: 'goals', label: 'Goles' },
  { key: 'assists', label: 'Asistencias' },
  { key: 'shots', label: 'Tiros' },
  { key: 'saves', label: 'Paradas' },
  { key: 'foulsCommitted', label: 'Faltas\nCometidas' },
  { key: 'foulsReceived', label: 'Faltas\nRecibidas' },
  { key: 'yellowCards', label: 'Amarillas' },
  { key: 'redCards', label: 'Rojas' },
]

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: 'Portero',
  defender: 'Defensa',
  midfielder: 'Centrocampista',
  forward: 'Delantero',
}

function getClubScore(match: AdminMatchRow) {
  return match.isHome ? match.homeScore : match.awayScore
}

function getOpponentScore(match: AdminMatchRow) {
  return match.isHome ? match.awayScore : match.homeScore
}

function getStatValue(match: AdminMatchRow, key: TeamStatKey, side: StatSide) {
  const homeKey = `home${key[0].toUpperCase()}${key.slice(1)}` as keyof AdminMatchRow
  const awayKey = `away${key[0].toUpperCase()}${key.slice(1)}` as keyof AdminMatchRow
  const value = match.isHome === (side === 'club') ? match[homeKey] : match[awayKey]
  return typeof value === 'number' ? value : null
}

function aggregateStat(matches: AdminMatchRow[], stat: TeamStatDefinition, side: StatSide) {
  const values = matches
    .map((match) => getStatValue(match, stat.key, side))
    .filter((value): value is number => typeof value === 'number')

  if (values.length === 0) return null
  const total = values.reduce((sum, value) => sum + value, 0)
  return stat.aggregate === 'average' ? Math.round(total / values.length) : total
}

function formatNumber(value: number | null | undefined, suffix = '') {
  if (typeof value !== 'number') return '-'
  return `${value}${suffix}`
}

function getBarWidth(value: number, max: number) {
  if (max <= 0) return 0
  return Math.max(5, Math.round((value / max) * 100))
}

function getPlayerPositionLabel(position: AdminMatchPlayerStat['position']) {
  return position ? POSITION_LABELS[position] ?? position : 'Sin posición'
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-foreground/10">
      <p className="text-[11px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black text-foreground">{value}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg bg-white/85 p-8 text-center ring-1 ring-foreground/10">
      <BarChart3 className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-muted-foreground">{text}</p>
    </div>
  )
}

export function StatsDashboard({ matches, teams, scope }: StatsDashboardProps) {
  const [tab, setTab] = useState<TabKey>('summary')
  const [seasonId, setSeasonId] = useState('all')
  const [teamId, setTeamId] = useState(scope === 'admin' ? teams[0]?.id ?? 'all' : 'all')
  const [matchType, setMatchType] = useState<MatchTypeFilter>('all')
  const [location, setLocation] = useState<LocationFilter>('all')
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.id ?? '')
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [selectedPlayerMatchId, setSelectedPlayerMatchId] = useState('all')
  const [playerMetric, setPlayerMetric] = useState<PlayerMetricKey>('goals')
  const [matchPlayerPosition, setMatchPlayerPosition] = useState<MatchPlayerPositionFilter>('all')
  const [matchPlayerStarter, setMatchPlayerStarter] = useState<MatchPlayerStarterFilter>('all')
  const [matchPlayerSort, setMatchPlayerSort] = useState<MatchPlayerSortKey>('shirtNumber')
  const [compareA, setCompareA] = useState<string>(teams[0]?.id ?? '')
  const [compareB, setCompareB] = useState<string>(teams[1]?.id ?? teams[0]?.id ?? '')

  const seasons = useMemo(() => {
    const byId = new Map<string, string>()
    for (const match of matches) byId.set(match.seasonId, match.seasonName)
    for (const team of teams) byId.set(team.seasonId, team.temporada)
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) => b.name.localeCompare(a.name, 'es'))
  }, [matches, teams])

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      if (seasonId !== 'all' && match.seasonId !== seasonId) return false
      if (teamId !== 'all' && match.teamId !== teamId) return false
      if (matchType !== 'all' && match.matchType !== matchType) return false
      if (location === 'home' && !match.isHome) return false
      if (location === 'away' && match.isHome) return false
      return true
    })
  }, [location, matchType, matches, seasonId, teamId])

  const playedMatches = useMemo(
    () => filteredMatches.filter((match) => match.status === 'played' && getClubScore(match) !== null && getOpponentScore(match) !== null),
    [filteredMatches],
  )

  const summary = useMemo(() => {
    const wins = playedMatches.filter((match) => (getClubScore(match) ?? 0) > (getOpponentScore(match) ?? 0)).length
    const draws = playedMatches.filter((match) => getClubScore(match) === getOpponentScore(match)).length
    const losses = playedMatches.filter((match) => (getClubScore(match) ?? 0) < (getOpponentScore(match) ?? 0)).length
    const goalsFor = playedMatches.reduce((total, match) => total + (getClubScore(match) ?? 0), 0)
    const goalsAgainst = playedMatches.reduce((total, match) => total + (getOpponentScore(match) ?? 0), 0)
    const points = wins * 3 + draws
    const cleanSheets = playedMatches.filter((match) => getOpponentScore(match) === 0).length
    return { played: playedMatches.length, wins, draws, losses, goalsFor, goalsAgainst, points, cleanSheets }
  }, [playedMatches])

  const playerSummaries = useMemo(() => {
    const byPlayer = new Map<string, PlayerSummary>()

    for (const match of filteredMatches) {
      for (const stat of match.playerStats) {
        const current = byPlayer.get(stat.athleteId) ?? {
          athleteId: stat.athleteId,
          athleteName: stat.athleteName,
          teamId: match.teamId,
          teamName: match.teamName,
          position: stat.position,
          callups: 0,
          starts: 0,
          minutes: 0,
          goals: 0,
          assists: 0,
          shots: 0,
          saves: 0,
          yellowCards: 0,
          redCards: 0,
          foulsCommitted: 0,
          foulsReceived: 0,
          matchRows: [],
        }

        if (stat.isCalledUp) current.callups += 1
        if (stat.isStarter) current.starts += 1
        current.minutes += stat.minutes
        current.goals += stat.goals
        current.assists += stat.assists
        current.shots += stat.shots
        current.saves += stat.saves
        current.yellowCards += stat.yellowCards
        current.redCards += stat.redCards
        current.foulsCommitted += stat.foulsCommitted
        current.foulsReceived += stat.foulsReceived
        current.matchRows.push({ match, stat })
        byPlayer.set(stat.athleteId, current)
      }
    }

    return Array.from(byPlayer.values()).sort((a, b) => {
      if (b[playerMetric] !== a[playerMetric]) return b[playerMetric] - a[playerMetric]
      return a.athleteName.localeCompare(b.athleteName, 'es')
    })
  }, [filteredMatches, playerMetric])

  const selectedMatch = filteredMatches.find((match) => match.id === selectedMatchId) ?? filteredMatches[0] ?? null
  const selectedMatchPlayerStats = useMemo(() => {
    if (!selectedMatch) return []

    return selectedMatch.playerStats
      .filter((stat) => {
        if (!stat.isCalledUp) return false
        if (matchPlayerPosition === 'none' && stat.position) return false
        if (matchPlayerPosition !== 'all' && matchPlayerPosition !== 'none' && stat.position !== matchPlayerPosition) return false
        if (matchPlayerStarter === 'starters' && !stat.isStarter) return false
        if (matchPlayerStarter === 'substitutes' && stat.isStarter) return false
        return true
      })
      .sort((a, b) => {
        if (matchPlayerSort === 'athleteName') {
          return a.athleteName.localeCompare(b.athleteName, 'es')
        }
        if (matchPlayerSort === 'shirtNumber') {
          return (a.shirtNumber ?? 999) - (b.shirtNumber ?? 999) || a.athleteName.localeCompare(b.athleteName, 'es')
        }

        const diff = b[matchPlayerSort] - a[matchPlayerSort]
        return diff || a.athleteName.localeCompare(b.athleteName, 'es')
      })
  }, [matchPlayerPosition, matchPlayerSort, matchPlayerStarter, selectedMatch])

  const selectedPlayer = playerSummaries.find((player) => player.athleteId === selectedPlayerId) ?? playerSummaries[0] ?? null
  const selectedPlayerRows =
    selectedPlayer?.matchRows.filter(({ match }) => selectedPlayerMatchId === 'all' || match.id === selectedPlayerMatchId) ?? []
  const selectedPlayerStats = selectedPlayerRows.reduce(
    (total, { stat }) => ({
      callups: total.callups + (stat.isCalledUp ? 1 : 0),
      starts: total.starts + (stat.isStarter ? 1 : 0),
      minutes: total.minutes + stat.minutes,
      goals: total.goals + stat.goals,
      assists: total.assists + stat.assists,
      shots: total.shots + stat.shots,
      saves: total.saves + stat.saves,
      yellowCards: total.yellowCards + stat.yellowCards,
      redCards: total.redCards + stat.redCards,
      foulsCommitted: total.foulsCommitted + stat.foulsCommitted,
      foulsReceived: total.foulsReceived + stat.foulsReceived,
    }),
    {
      callups: 0,
      starts: 0,
      minutes: 0,
      goals: 0,
      assists: 0,
      shots: 0,
      saves: 0,
      yellowCards: 0,
      redCards: 0,
      foulsCommitted: 0,
      foulsReceived: 0,
    },
  )
  const playerOptions = [...playerSummaries].sort((a, b) => a.athleteName.localeCompare(b.athleteName, 'es'))
  const topMetricValue = Math.max(0, ...playerSummaries.map((player) => player[playerMetric]))
  const statGroups = Array.from(new Set(TEAM_STATS.map((stat) => stat.group)))

  const compareTeams = useMemo(() => {
    return [compareA, compareB].map((id) => {
      const teamMatches = filteredMatches.filter((match) => match.teamId === id)
      const played = teamMatches.filter((match) => match.status === 'played' && getClubScore(match) !== null && getOpponentScore(match) !== null)
      const wins = played.filter((match) => (getClubScore(match) ?? 0) > (getOpponentScore(match) ?? 0)).length
      const goalsFor = played.reduce((total, match) => total + (getClubScore(match) ?? 0), 0)
      const goalsAgainst = played.reduce((total, match) => total + (getOpponentScore(match) ?? 0), 0)
      return {
        id,
        name: teams.find((team) => team.id === id)?.nombre ?? 'Equipo',
        played: played.length,
        wins,
        goalsFor,
        goalsAgainst,
        shots: aggregateStat(teamMatches, TEAM_STATS.find((stat) => stat.key === 'totalShots')!, 'club') ?? 0,
      }
    })
  }, [compareA, compareB, filteredMatches, teams])

  if (matches.length === 0) {
    return <EmptyState text="No hay partidos para calcular estadísticas." />
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-white/85 p-3 ring-1 ring-foreground/10">
        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-foreground">
          <ListFilter className="size-4 text-primary" aria-hidden="true" />
          Filtros
        </div>
        <div className={cn('grid gap-3', scope === 'admin' ? 'md:grid-cols-4' : 'md:grid-cols-3')}>
          <FilterSelect label="Temporada" value={seasonId} onChange={setSeasonId}>
            <option value="all">Todas las temporadas</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>{season.name}</option>
            ))}
          </FilterSelect>
          {scope === 'admin' ? (
            <FilterSelect label="Equipo" value={teamId} onChange={setTeamId}>
              {teams.length === 0 ? <option value="all">Sin equipos disponibles</option> : null}
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.nombre}</option>
              ))}
            </FilterSelect>
          ) : null}
          <FilterSelect label="Tipo" value={matchType} onChange={(value) => setMatchType(value as MatchTypeFilter)}>
            <option value="all">Todos los tipos</option>
            <option value="league">Liga</option>
            <option value="friendly">Amistoso</option>
          </FilterSelect>
          <FilterSelect label="Campo" value={location} onChange={(value) => setLocation(value as LocationFilter)}>
            <option value="all">Local y visitante</option>
            <option value="home">Solo local</option>
            <option value="away">Solo visitante</option>
          </FilterSelect>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => {
          const Icon = item.icon
          const active = tab === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'bg-primary text-primary-foreground' : 'bg-white text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </div>

      {filteredMatches.length === 0 ? (
        <EmptyState text="No hay partidos con los filtros seleccionados." />
      ) : null}

      {tab === 'summary' && filteredMatches.length > 0 ? (
        <div className="space-y-4">
          <section className="grid gap-3 md:grid-cols-4">
            <StatPill label="Partidos jugados" value={summary.played} />
            <StatPill label="Balance" value={`${summary.wins}V · ${summary.draws}E · ${summary.losses}D`} />
            <StatPill label="Goles" value={`${summary.goalsFor} - ${summary.goalsAgainst}`} />
            <StatPill label="Puntos estimados" value={summary.points} />
          </section>

          <section className="grid gap-4 lg:grid-cols-4">
            {statGroups.map((group) => (
              <div key={group} className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
                <h2 className="text-sm font-black uppercase text-foreground">{group}</h2>
                <div className="mt-3 divide-y divide-border">
                  {TEAM_STATS.filter((stat) => stat.group === group).map((stat) => (
                    <CompareRow
                      key={stat.key}
                      label={stat.label}
                      left={aggregateStat(filteredMatches, stat, 'club')}
                      right={aggregateStat(filteredMatches, stat, 'opponent')}
                      suffix={stat.suffix}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      ) : null}

      {tab === 'players' && filteredMatches.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
            {selectedPlayer ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <FilterSelect
                    label="Jugador"
                    value={selectedPlayer.athleteId}
                    onChange={(value) => {
                      setSelectedPlayerId(value)
                      setSelectedPlayerMatchId('all')
                    }}
                  >
                    {playerOptions.map((player) => (
                      <option key={player.athleteId} value={player.athleteId}>{player.athleteName}</option>
                    ))}
                  </FilterSelect>
                  <FilterSelect label="Partido" value={selectedPlayerMatchId} onChange={setSelectedPlayerMatchId}>
                    <option value="all">Todos los partidos</option>
                    {selectedPlayer.matchRows.map(({ match }) => (
                      <option key={match.id} value={match.id}>
                        {match.dateLabel} · {match.opponentName}
                      </option>
                    ))}
                  </FilterSelect>
                </div>

                <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-muted-foreground">{selectedPlayer.teamName}</p>
                    <h2 className="mt-1 text-lg font-black text-foreground">{selectedPlayer.athleteName}</h2>
                    <p className="text-sm text-muted-foreground">{getPlayerPositionLabel(selectedPlayer.position)}</p>
                  </div>
                  <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
                    {selectedPlayerMatchId === 'all' ? 'Temporada filtrada' : 'Partido'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                  <StatPill label="Minutos" value={selectedPlayerStats.minutes} />
                  <StatPill label="Goles" value={selectedPlayerStats.goals} />
                  <StatPill label="Asistencias" value={selectedPlayerStats.assists} />
                  <StatPill label="Convocatorias" value={selectedPlayerStats.callups} />
                  <StatPill label="Titularidades" value={selectedPlayerStats.starts} />
                  <StatPill label="Tiros" value={selectedPlayerStats.shots} />
                  <StatPill label="Amarillas" value={selectedPlayerStats.yellowCards} />
                  <StatPill label="Rojas" value={selectedPlayerStats.redCards} />
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  <StatPill label="Paradas" value={selectedPlayerStats.saves} />
                  <StatPill label="Faltas cometidas" value={selectedPlayerStats.foulsCommitted} />
                  <StatPill label="Faltas recibidas" value={selectedPlayerStats.foulsReceived} />
                  <StatPill label="Partidos en el filtro" value={selectedPlayerRows.length} />
                </div>

                <div className="mt-4 space-y-2">
                  {selectedPlayerRows.slice(0, 8).map(({ match, stat }) => (
                    <div key={match.id} className="rounded-lg border border-border px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-foreground">{match.dateLabel} · {match.opponentName}</p>
                        <span className="text-xs font-black text-muted-foreground">{stat.minutes}'</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {stat.goals} goles · {stat.assists} asist. · {stat.shots} tiros · {stat.yellowCards} amarillas · {stat.redCards} rojas
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState text="No hay estadísticas individuales con estos filtros." />
            )}
          </div>

          <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase text-foreground">Ranking</h2>
              <FilterSelect label="Ordenar por" value={playerMetric} onChange={(value) => setPlayerMetric(value as PlayerMetricKey)} compact>
                {PLAYER_METRICS.map((metric) => (
                  <option key={metric.key} value={metric.key}>{metric.label}</option>
                ))}
              </FilterSelect>
            </div>
            <div className="mt-4 space-y-2">
              {playerSummaries.map((player, index) => (
                <button
                  key={player.athleteId}
                  type="button"
                  onClick={() => {
                    setSelectedPlayerId(player.athleteId)
                    setSelectedPlayerMatchId('all')
                  }}
                  className={cn(
                    'grid w-full grid-cols-[32px_1fr_auto] items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selectedPlayer?.athleteId === player.athleteId
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-white hover:bg-muted/40',
                  )}
                >
                  <span className="text-xs font-black text-muted-foreground">{index + 1}</span>
                  <span className="truncate text-sm font-bold text-foreground">{player.athleteName}</span>
                  <span className="rounded-lg bg-muted px-2 py-1 text-sm font-black text-foreground">
                    {player[playerMetric]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'matches' && filteredMatches.length > 0 ? (
        <section className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-center justify-start gap-3">
            <FilterSelect label="Partido" value={selectedMatch?.id ?? ''} onChange={setSelectedMatchId} compact>
              {filteredMatches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.dateLabel} · {match.teamName} vs {match.opponentName}
                </option>
              ))}
            </FilterSelect>
          </div>

          {selectedMatch ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(260px,0.58fr)_minmax(720px,1.42fr)]">
              <div className="rounded-lg border border-border bg-white">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border px-4 py-4">
                  <div className="text-right">
                    <p className="text-sm font-black">{selectedMatch.isHome ? selectedMatch.teamName : selectedMatch.opponentName}</p>
                    <p className="text-xs text-muted-foreground">{selectedMatch.isHome ? CLUB.shortName : 'Rival'}</p>
                  </div>
                  <div className="rounded-lg bg-muted px-4 py-2 text-2xl font-black">
                    {formatNumber(selectedMatch.homeScore)} - {formatNumber(selectedMatch.awayScore)}
                  </div>
                  <div>
                    <p className="text-sm font-black">{selectedMatch.isHome ? selectedMatch.opponentName : selectedMatch.teamName}</p>
                    <p className="text-xs text-muted-foreground">{selectedMatch.isHome ? 'Rival' : CLUB.shortName}</p>
                  </div>
                </div>
                <div className="p-4">
                  {TEAM_STATS.map((stat) => (
                    <CompareRow
                      key={stat.key}
                      label={stat.label}
                      left={getStatValue(selectedMatch, stat.key, 'club')}
                      right={getStatValue(selectedMatch, stat.key, 'opponent')}
                      suffix={stat.suffix}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-white p-4">
                <h3 className="text-sm font-black uppercase text-foreground">Jugadores del partido</h3>

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <FilterSelect
                    label="Posición"
                    value={matchPlayerPosition}
                    onChange={(value) => setMatchPlayerPosition(value as MatchPlayerPositionFilter)}
                  >
                    <option value="all">Todas</option>
                    <option value="goalkeeper">Porteros</option>
                    <option value="defender">Defensas</option>
                    <option value="midfielder">Centrocampistas</option>
                    <option value="forward">Delanteros</option>
                    <option value="none">Sin posición</option>
                  </FilterSelect>
                  <FilterSelect
                    label="Titularidad"
                    value={matchPlayerStarter}
                    onChange={(value) => setMatchPlayerStarter(value as MatchPlayerStarterFilter)}
                  >
                    <option value="all">Todos</option>
                    <option value="starters">Titulares</option>
                    <option value="substitutes">Suplentes</option>
                  </FilterSelect>
                  <FilterSelect
                    label="Ordenar por"
                    value={matchPlayerSort}
                    onChange={(value) => setMatchPlayerSort(value as MatchPlayerSortKey)}
                  >
                    {MATCH_PLAYER_SORT_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </FilterSelect>
                </div>

                <div className="mt-4 grid gap-1.5">
                  {selectedMatchPlayerStats.length > 0 ? (
                    <>
                      <div className="hidden rounded-lg bg-muted/50 px-3 py-2 md:grid md:grid-cols-[minmax(160px,0.7fr)_repeat(8,minmax(54px,1fr))] md:items-center md:gap-2">
                        <span className="text-[11px] font-black uppercase text-muted-foreground">Jugador</span>
                        {MATCH_PLAYER_STAT_COLUMNS.map((column) => (
                          <span
                            key={column.key}
                            className="whitespace-pre-line text-center text-[10px] font-black uppercase leading-tight text-muted-foreground"
                          >
                            {column.label}
                          </span>
                        ))}
                      </div>
                      {selectedMatchPlayerStats.map((stat) => (
                        <div
                          key={stat.athleteId}
                          className="grid gap-2 rounded-lg border border-border bg-white px-3 py-2 md:grid-cols-[minmax(160px,0.7fr)_repeat(8,minmax(54px,1fr))] md:items-center md:gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-black text-foreground">{stat.athleteName}</p>
                              <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-primary">
                                {stat.minutes}'
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-[11px] font-semibold text-muted-foreground">
                              {getPlayerPositionLabel(stat.position)} · Dorsal {stat.shirtNumber ?? '-'} · {stat.isStarter ? 'Titular' : 'Suplente'}
                            </p>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5 md:contents">
                            {MATCH_PLAYER_STAT_COLUMNS.map((column) => (
                              <PlayerMatchMetric key={column.key} label={column.label} value={stat[column.key]} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="rounded-lg border border-border bg-muted/30 px-3 py-6 text-center text-sm font-semibold text-muted-foreground">
                      No hay jugadores con esos filtros.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'compare' && filteredMatches.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
          <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-end gap-3">
              <FilterSelect label="Equipo A" value={compareA} onChange={setCompareA} compact>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.nombre}</option>)}
              </FilterSelect>
              <FilterSelect label="Equipo B" value={compareB} onChange={setCompareB} compact>
                {teams.map((team) => <option key={team.id} value={team.id}>{team.nombre}</option>)}
              </FilterSelect>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {compareTeams.map((team) => (
                <div key={team.id} className="rounded-lg border border-border bg-white p-4">
                  <h2 className="text-base font-black text-foreground">{team.name}</h2>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <StatPill label="Jugados" value={team.played} />
                    <StatPill label="Victorias" value={team.wins} />
                    <StatPill label="Goles" value={`${team.goalsFor}-${team.goalsAgainst}`} />
                    <StatPill label="Disparos" value={team.shots} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase text-foreground">
              <Medal className="size-4 text-primary" aria-hidden="true" />
              Top {PLAYER_METRICS.find((metric) => metric.key === playerMetric)?.label}
            </h2>
            <div className="mt-4 space-y-3">
              {playerSummaries.slice(0, 8).map((player, index) => (
                <div key={player.athleteId}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="font-bold text-foreground">{index + 1}. {player.athleteName}</span>
                    <span className="font-black text-foreground">{player[playerMetric]}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${getBarWidth(player[playerMetric], topMetricValue)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
  compact = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  compact?: boolean
}) {
  return (
    <label className={cn('grid gap-1', compact ? 'min-w-56' : '')}>
      <span className="text-[11px] font-bold uppercase text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-input bg-white px-3 text-sm font-semibold text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {children}
      </select>
    </label>
  )
}

function PlayerMatchMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/40 px-1.5 py-1 text-center md:bg-transparent md:px-0">
      <p className="whitespace-pre-line text-[9px] font-bold uppercase leading-tight text-muted-foreground md:hidden">{label}</p>
      <p className="text-sm font-black leading-tight text-foreground">{value}</p>
    </div>
  )
}

function CompareRow({
  label,
  left,
  right,
  suffix = '',
}: {
  label: string
  left: number | null
  right: number | null
  suffix?: string
}) {
  const leftValue = left ?? 0
  const rightValue = right ?? 0
  const total = leftValue + rightValue
  const leftWidth = total === 0 ? 50 : getBarWidth(leftValue, total)
  const rightWidth = total === 0 ? 50 : getBarWidth(rightValue, total)

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="grid grid-cols-[72px_1fr_72px] items-center gap-3">
        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-center text-xs font-black text-emerald-800">
          {formatNumber(left, suffix)}
        </span>
        <span className="text-center text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="rounded-lg bg-sky-50 px-2 py-1 text-center text-xs font-black text-sky-800">
          {formatNumber(right, suffix)}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="ml-auto h-full rounded-full bg-emerald-500" style={{ width: `${leftWidth}%` }} />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-sky-500" style={{ width: `${rightWidth}%` }} />
        </div>
      </div>
    </div>
  )
}
