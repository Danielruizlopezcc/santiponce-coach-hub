'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, BarChart3, CalendarDays, GitCompare, ListFilter, Medal, Shield, Trophy, Users } from 'lucide-react'
import { CLUB } from '@/lib/club'
import type { AdminMatchPlayerStat, AdminMatchRow, AdminTeamRow, AdminTrainingSessionRow, TrainingAttendanceStatus } from '@/lib/admin-app'
import { cn } from '@/lib/utils'

type StatsDashboardProps = {
  matches: AdminMatchRow[]
  teams: AdminTeamRow[]
  trainings?: AdminTrainingSessionRow[]
  scope: 'coach' | 'admin'
}

type TabKey = 'summary' | 'teams' | 'players' | 'matches' | 'compare'
type CompareTabKey = 'teams' | 'players' | 'history'
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
  | 'trainingAttendanceRate'

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
  trainingSessions: number
  trainingAttended: number
  trainingLate: number
  trainingJustifiedAbsences: number
  trainingUnjustifiedAbsences: number
  trainingAttendanceRate: number
  matchRows: Array<{ match: AdminMatchRow; stat: AdminMatchPlayerStat }>
}

const TABS: Array<{
  key: TabKey
  label: string
  eyebrow: string
  description: string
  icon: typeof BarChart3
  tone: 'blue' | 'green' | 'amber' | 'slate'
}> = [
  {
    key: 'summary',
    label: 'Resumen',
    eyebrow: 'Vista global',
    description: 'KPIs, balance deportivo y lectura rápida del rendimiento.',
    icon: BarChart3,
    tone: 'blue',
  },
  {
    key: 'players',
    label: 'Jugadores',
    eyebrow: 'Individual',
    description: 'Ficha de jugador, rankings y aportación por partido.',
    icon: Users,
    tone: 'green',
  },
  {
    key: 'teams',
    label: 'Equipos',
    eyebrow: 'Bloques',
    description: 'Clasificación, rachas y rendimiento de cada plantilla.',
    icon: Trophy,
    tone: 'blue',
  },
  {
    key: 'matches',
    label: 'Partidos',
    eyebrow: 'Acta',
    description: 'Detalle de cada encuentro y estadísticas club-rival.',
    icon: Shield,
    tone: 'amber',
  },
  {
    key: 'compare',
    label: 'Comparativas',
    eyebrow: 'Cruces',
    description: 'Comparación entre equipos y rankings filtrados.',
    icon: GitCompare,
    tone: 'slate',
  },
]

const ATTENDANCE_LABELS: Record<TrainingAttendanceStatus, string> = {
  attended: 'Asistido',
  justified_absence: 'Falta justificada',
  unjustified_absence: 'Falta injustificada',
  late: 'Llega tarde',
}

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
  { key: 'trainingAttendanceRate', label: 'Asistencia entrenos' },
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

function formatDecimal(value: number, suffix = '') {
  return `${value.toLocaleString('es-ES', { maximumFractionDigits: 1 })}${suffix}`
}

function formatPercent(value: number, total: number) {
  if (total <= 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function getBarWidth(value: number, max: number) {
  if (max <= 0) return 0
  return Math.max(5, Math.round((value / max) * 100))
}

function getMatchResult(match: AdminMatchRow) {
  const clubScore = getClubScore(match) ?? 0
  const opponentScore = getOpponentScore(match) ?? 0
  if (clubScore > opponentScore) return 'V'
  if (clubScore < opponentScore) return 'D'
  return 'E'
}

function getMatchDisplayLabel(match: AdminMatchRow) {
  const homeName = match.isHome ? match.teamName : match.opponentName
  const awayName = match.isHome ? match.opponentName : match.teamName
  return `${match.dateLabel} · ${homeName} vs ${awayName}`
}

function getPlayerPositionLabel(position: AdminMatchPlayerStat['position']) {
  return position ? POSITION_LABELS[position] ?? position : 'Sin posición'
}

function StatPill({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string
  value: string | number
  detail?: string
  tone?: 'default' | 'green' | 'amber' | 'blue' | 'red'
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-lg px-3 py-2 ring-1 ring-foreground/10',
        tone === 'default' && 'bg-white',
        tone === 'green' && 'bg-emerald-50 ring-emerald-200',
        tone === 'amber' && 'bg-amber-50 ring-amber-200',
        tone === 'blue' && 'bg-blue-50 ring-blue-200',
        tone === 'red' && 'bg-red-50 ring-red-200',
      )}
    >
      <p className="text-[11px] font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-xl font-black text-foreground">{value}</p>
      {detail ? <p className="mt-1 break-words text-[11px] font-semibold leading-4 text-muted-foreground">{detail}</p> : null}
    </div>
  )
}

function RankingCard({
  title,
  items,
}: {
  title: string
  items: Array<{ id: string; label: string; value: string | number; detail?: string }>
}) {
  return (
    <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
      <h2 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-lg border border-border bg-white px-3 py-2">
              <span className="text-xs font-black text-muted-foreground">{index + 1}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-foreground">{item.label}</span>
                {item.detail ? <span className="block truncate text-xs font-semibold text-muted-foreground">{item.detail}</span> : null}
              </span>
              <span className="rounded-lg bg-primary/10 px-2 py-1 text-sm font-black text-primary">{item.value}</span>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm font-semibold text-muted-foreground">
            Sin datos suficientes.
          </p>
        )}
      </div>
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

export function StatsDashboard({ matches, teams, trainings = [], scope }: StatsDashboardProps) {
  const [tab, setTab] = useState<TabKey>('summary')
  const [compareTab, setCompareTab] = useState<CompareTabKey>('teams')
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
  const [teamFocusId, setTeamFocusId] = useState<string>(teams[0]?.id ?? '')
  const [compareA, setCompareA] = useState<string>(teams[0]?.id ?? '')
  const [compareB, setCompareB] = useState<string>(teams[1]?.id ?? teams[0]?.id ?? '')
  const [comparePlayerA, setComparePlayerA] = useState('')
  const [comparePlayerB, setComparePlayerB] = useState('')
  const [compareSeasonTeamName, setCompareSeasonTeamName] = useState<string>(teams[0]?.nombre ?? '')
  const [compareSeasonA, setCompareSeasonA] = useState('')
  const [compareSeasonB, setCompareSeasonB] = useState('')

  const seasons = useMemo(() => {
    const byId = new Map<string, string>()
    for (const match of matches) byId.set(match.seasonId, match.seasonName)
    for (const team of teams) byId.set(team.seasonId, team.temporada)
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) => b.name.localeCompare(a.name, 'es'))
  }, [matches, teams])
  const teamNameOptions = Array.from(new Set(teams.map((team) => team.nombre))).sort((a, b) => a.localeCompare(b, 'es'))
  const seasonCompareA = compareSeasonA || seasons[0]?.id || ''
  const seasonCompareB = compareSeasonB || seasons[1]?.id || seasons[0]?.id || ''

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
  const filteredTrainings = useMemo(() => {
    return trainings.filter((training) => {
      if (seasonId !== 'all' && training.seasonId !== seasonId) return false
      if (teamId !== 'all' && training.teamId !== teamId) return false
      return true
    })
  }, [seasonId, teamId, trainings])

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
    const goalDifference = goalsFor - goalsAgainst
    const goalsForAverage = playedMatches.length > 0 ? goalsFor / playedMatches.length : 0
    const goalsAgainstAverage = playedMatches.length > 0 ? goalsAgainst / playedMatches.length : 0
    const pointsAverage = playedMatches.length > 0 ? points / playedMatches.length : 0
    const form = [...playedMatches]
      .sort((a, b) => b.matchDate.localeCompare(a.matchDate) || b.matchTime.localeCompare(a.matchTime))
      .slice(0, 5)
      .map(getMatchResult)
    return {
      played: playedMatches.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      points,
      cleanSheets,
      goalDifference,
      goalsForAverage,
      goalsAgainstAverage,
      pointsAverage,
      form,
    }
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
          trainingSessions: 0,
          trainingAttended: 0,
          trainingLate: 0,
          trainingJustifiedAbsences: 0,
          trainingUnjustifiedAbsences: 0,
          trainingAttendanceRate: 0,
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

    for (const training of filteredTrainings) {
      for (const attendance of training.attendance) {
        if (!attendance.status) continue
        const current = byPlayer.get(attendance.athleteId) ?? {
          athleteId: attendance.athleteId,
          athleteName: attendance.athleteName,
          teamId: training.teamId,
          teamName: training.teamName,
          position: attendance.position,
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
          trainingSessions: 0,
          trainingAttended: 0,
          trainingLate: 0,
          trainingJustifiedAbsences: 0,
          trainingUnjustifiedAbsences: 0,
          trainingAttendanceRate: 0,
          matchRows: [],
        }

        current.trainingSessions += 1
        if (attendance.status === 'attended') current.trainingAttended += 1
        if (attendance.status === 'late') current.trainingLate += 1
        if (attendance.status === 'justified_absence') current.trainingJustifiedAbsences += 1
        if (attendance.status === 'unjustified_absence') current.trainingUnjustifiedAbsences += 1
        byPlayer.set(attendance.athleteId, current)
      }
    }

    for (const player of byPlayer.values()) {
      player.trainingAttendanceRate = player.trainingSessions > 0
        ? Math.round(((player.trainingAttended + player.trainingLate) / player.trainingSessions) * 100)
        : 0
    }

    return Array.from(byPlayer.values()).sort((a, b) => {
      if (b[playerMetric] !== a[playerMetric]) return b[playerMetric] - a[playerMetric]
      return a.athleteName.localeCompare(b.athleteName, 'es')
    })
  }, [filteredMatches, filteredTrainings, playerMetric])

  const selectedMatch = filteredMatches.find((match) => match.id === selectedMatchId) ?? filteredMatches[0] ?? null
  const selectedMatchPlayed = selectedMatch?.status === 'played' && getClubScore(selectedMatch) !== null && getOpponentScore(selectedMatch) !== null
  const selectedMatchResult = selectedMatch && selectedMatchPlayed ? getMatchResult(selectedMatch) : null
  const selectedMatchSummary = selectedMatch
    ? {
        calledUp: selectedMatch.playerStats.filter((stat) => stat.isCalledUp).length,
        starters: selectedMatch.playerStats.filter((stat) => stat.isCalledUp && stat.isStarter).length,
        substitutes: selectedMatch.playerStats.filter((stat) => stat.isCalledUp && !stat.isStarter).length,
        playerGoals: selectedMatch.playerStats.reduce((sum, stat) => sum + stat.goals, 0),
        playerAssists: selectedMatch.playerStats.reduce((sum, stat) => sum + stat.assists, 0),
        cards: selectedMatch.playerStats.reduce((sum, stat) => sum + stat.yellowCards + stat.redCards, 0),
      }
    : null
  const selectedMatchFeaturedPlayers = selectedMatch
    ? [...selectedMatch.playerStats]
        .filter((stat) => stat.isCalledUp)
        .sort((a, b) => {
          const contributionDiff = b.goals + b.assists - (a.goals + a.assists)
          if (contributionDiff !== 0) return contributionDiff
          return b.minutes - a.minutes || a.athleteName.localeCompare(b.athleteName, 'es')
        })
        .slice(0, 4)
    : []
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
  const selectedPlayerAdvanced = {
    goalContributions: selectedPlayerStats.goals + selectedPlayerStats.assists,
    starterRate: formatPercent(selectedPlayerStats.starts, selectedPlayerStats.callups),
    goalsPer100: selectedPlayerStats.minutes > 0 ? (selectedPlayerStats.goals / selectedPlayerStats.minutes) * 100 : 0,
    assistsPer100: selectedPlayerStats.minutes > 0 ? (selectedPlayerStats.assists / selectedPlayerStats.minutes) * 100 : 0,
    shotEfficiency: formatPercent(selectedPlayerStats.goals, selectedPlayerStats.shots),
  }
  const playerOptions = [...playerSummaries].sort((a, b) => a.athleteName.localeCompare(b.athleteName, 'es'))
  const comparePlayerLeft = playerOptions.find((player) => player.athleteId === comparePlayerA) ?? playerOptions[0] ?? null
  const comparePlayerRight = playerOptions.find((player) => player.athleteId === comparePlayerB) ?? playerOptions[1] ?? playerOptions[0] ?? null
  const topMetricValue = playerMetric === 'trainingAttendanceRate'
    ? 100
    : Math.max(0, ...playerSummaries.map((player) => player[playerMetric]))
  const statGroups = Array.from(new Set(TEAM_STATS.map((stat) => stat.group)))
  const teamSummaries = useMemo(() => {
    const byTeam = new Map<string, {
      id: string
      name: string
      played: number
      wins: number
      draws: number
      losses: number
      goalsFor: number
      goalsAgainst: number
      points: number
    }>()

    for (const match of playedMatches) {
      const current = byTeam.get(match.teamId) ?? {
        id: match.teamId,
        name: match.teamName,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      }
      const clubScore = getClubScore(match) ?? 0
      const opponentScore = getOpponentScore(match) ?? 0

      current.played += 1
      current.goalsFor += clubScore
      current.goalsAgainst += opponentScore
      if (clubScore > opponentScore) {
        current.wins += 1
        current.points += 3
      } else if (clubScore === opponentScore) {
        current.draws += 1
        current.points += 1
      } else {
        current.losses += 1
      }
      byTeam.set(match.teamId, current)
    }

    return Array.from(byTeam.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
    })
  }, [playedMatches])
  const topScorers = [...playerSummaries]
    .filter((player) => player.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.athleteName.localeCompare(b.athleteName, 'es'))
    .slice(0, 5)
  const topAssistants = [...playerSummaries]
    .filter((player) => player.assists > 0)
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals || a.athleteName.localeCompare(b.athleteName, 'es'))
    .slice(0, 5)
  const topMinutes = [...playerSummaries]
    .filter((player) => player.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes || a.athleteName.localeCompare(b.athleteName, 'es'))
    .slice(0, 5)
  const bestAttack = [...teamSummaries].sort((a, b) => b.goalsFor / Math.max(1, b.played) - a.goalsFor / Math.max(1, a.played))[0]
  const bestDefense = [...teamSummaries].sort((a, b) => a.goalsAgainst / Math.max(1, a.played) - b.goalsAgainst / Math.max(1, b.played))[0]
  const teamAnalysisRows = teamSummaries.map((team) => {
    const teamMatches = filteredMatches.filter((match) => match.teamId === team.id)
    const teamPlayed = playedMatches.filter((match) => match.teamId === team.id)
    const totalShots = aggregateStat(teamMatches, TEAM_STATS.find((stat) => stat.key === 'totalShots')!, 'club') ?? 0
    const possession = aggregateStat(teamMatches, TEAM_STATS.find((stat) => stat.key === 'possession')!, 'club')
    const cards = (aggregateStat(teamMatches, TEAM_STATS.find((stat) => stat.key === 'yellowCards')!, 'club') ?? 0) +
      (aggregateStat(teamMatches, TEAM_STATS.find((stat) => stat.key === 'redCards')!, 'club') ?? 0)
    const form = [...teamPlayed]
      .sort((a, b) => b.matchDate.localeCompare(a.matchDate) || b.matchTime.localeCompare(a.matchTime))
      .slice(0, 5)
      .map(getMatchResult)

    return {
      ...team,
      goalDifference: team.goalsFor - team.goalsAgainst,
      winRate: formatPercent(team.wins, team.played),
      goalsForAverage: team.played > 0 ? team.goalsFor / team.played : 0,
      goalsAgainstAverage: team.played > 0 ? team.goalsAgainst / team.played : 0,
      totalMatches: teamMatches.length,
      totalShots,
      possession,
      cards,
      form,
    }
  })
  const selectedTeamAnalysis =
    teamAnalysisRows.find((team) => team.id === teamFocusId) ?? teamAnalysisRows[0] ?? null
  const selectedTeamMatches = selectedTeamAnalysis
    ? filteredMatches.filter((match) => match.teamId === selectedTeamAnalysis.id)
    : []
  const selectedTeamHomeMatches = selectedTeamMatches.filter((match) => match.isHome)
  const selectedTeamAwayMatches = selectedTeamMatches.filter((match) => !match.isHome)
  const selectedTeamPlayedMatches = selectedTeamMatches.filter(
    (match) => match.status === 'played' && getClubScore(match) !== null && getOpponentScore(match) !== null,
  )
  const selectedTeamCleanSheets = selectedTeamPlayedMatches.filter((match) => getOpponentScore(match) === 0).length
  const selectedTeamPointsAverage = selectedTeamAnalysis && selectedTeamAnalysis.played > 0
    ? selectedTeamAnalysis.points / selectedTeamAnalysis.played
    : 0
  const selectedTeamPlayers = selectedTeamAnalysis
    ? playerSummaries
        .filter((player) => player.teamId === selectedTeamAnalysis.id)
        .sort((a, b) => b.goals + b.assists - (a.goals + a.assists) || b.minutes - a.minutes)
        .slice(0, 8)
    : []
  const selectedTeamTrainings = selectedTeamAnalysis
    ? filteredTrainings.filter((training) => training.teamId === selectedTeamAnalysis.id)
    : []
  const selectedTeamAttendanceTotal = selectedTeamTrainings.reduce(
    (total, training) => total + training.attendance.filter((row) => Boolean(row.status)).length,
    0,
  )
  const selectedTeamAttendanceCounts = selectedTeamTrainings.reduce(
    (totals, training) => {
      for (const row of training.attendance) {
        if (!row.status) continue
        totals[row.status] += 1
      }
      return totals
    },
    {
      attended: 0,
      justified_absence: 0,
      unjustified_absence: 0,
      late: 0,
    } as Record<TrainingAttendanceStatus, number>,
  )
  const selectedTeamAttendanceRate = formatPercent(
    selectedTeamAttendanceCounts.attended + selectedTeamAttendanceCounts.late,
    selectedTeamAttendanceTotal,
  )

  const compareTeams = useMemo(() => {
    return [compareA, compareB].map((id) => {
      const teamMatches = filteredMatches.filter((match) => match.teamId === id)
      const played = teamMatches.filter((match) => match.status === 'played' && getClubScore(match) !== null && getOpponentScore(match) !== null)
      const wins = played.filter((match) => (getClubScore(match) ?? 0) > (getOpponentScore(match) ?? 0)).length
      const draws = played.filter((match) => getClubScore(match) === getOpponentScore(match)).length
      const losses = played.filter((match) => (getClubScore(match) ?? 0) < (getOpponentScore(match) ?? 0)).length
      const goalsFor = played.reduce((total, match) => total + (getClubScore(match) ?? 0), 0)
      const goalsAgainst = played.reduce((total, match) => total + (getOpponentScore(match) ?? 0), 0)
      const points = wins * 3 + draws
      const yellowCards = aggregateStat(teamMatches, TEAM_STATS.find((stat) => stat.key === 'yellowCards')!, 'club') ?? 0
      const redCards = aggregateStat(teamMatches, TEAM_STATS.find((stat) => stat.key === 'redCards')!, 'club') ?? 0
      return {
        id,
        name: teams.find((team) => team.id === id)?.nombre ?? 'Equipo',
        played: played.length,
        wins,
        draws,
        losses,
        points,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        goalsForAverage: played.length > 0 ? goalsFor / played.length : 0,
        goalsAgainstAverage: played.length > 0 ? goalsAgainst / played.length : 0,
        shots: aggregateStat(teamMatches, TEAM_STATS.find((stat) => stat.key === 'totalShots')!, 'club') ?? 0,
        possession: aggregateStat(teamMatches, TEAM_STATS.find((stat) => stat.key === 'possession')!, 'club'),
        cards: yellowCards + redCards,
      }
    })
  }, [compareA, compareB, filteredMatches, teams])
  const compareSeasonRows = [seasonCompareA, seasonCompareB].map((seasonIdToCompare) => {
    const seasonMatches = matches.filter((match) => {
      if (match.seasonId !== seasonIdToCompare) return false
      if (compareSeasonTeamName && match.teamName !== compareSeasonTeamName) return false
      if (matchType !== 'all' && match.matchType !== matchType) return false
      if (location === 'home' && !match.isHome) return false
      if (location === 'away' && match.isHome) return false
      return true
    })
    const played = seasonMatches.filter((match) => match.status === 'played' && getClubScore(match) !== null && getOpponentScore(match) !== null)
    const wins = played.filter((match) => (getClubScore(match) ?? 0) > (getOpponentScore(match) ?? 0)).length
    const draws = played.filter((match) => getClubScore(match) === getOpponentScore(match)).length
    const losses = played.filter((match) => (getClubScore(match) ?? 0) < (getOpponentScore(match) ?? 0)).length
    const goalsFor = played.reduce((total, match) => total + (getClubScore(match) ?? 0), 0)
    const goalsAgainst = played.reduce((total, match) => total + (getOpponentScore(match) ?? 0), 0)
    const points = wins * 3 + draws

    return {
      id: seasonIdToCompare,
      name: seasons.find((season) => season.id === seasonIdToCompare)?.name ?? 'Temporada',
      matches: seasonMatches.length,
      played: played.length,
      wins,
      draws,
      losses,
      points,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      pointsAverage: played.length > 0 ? points / played.length : 0,
    }
  })
  const currentTab = TABS.find((item) => item.key === tab) ?? TABS[0]
  const activeTeamName =
    teamId === 'all'
      ? scope === 'admin'
        ? 'Todos los equipos'
        : 'Equipo asignado'
      : teams.find((team) => team.id === teamId)?.nombre ?? 'Equipo seleccionado'

  if (matches.length === 0 && trainings.length === 0) {
    return <EmptyState text="No hay datos para calcular estadísticas." />
  }

  return (
    <div className="min-w-0 space-y-5">
      <section className="overflow-hidden rounded-xl border border-primary/15 bg-white shadow-sm">
        <div className="grid gap-0 xl:grid-cols-[0.5fr_1.5fr]">
          <div className="bg-primary p-4 text-primary-foreground">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">
              Centro de análisis
            </p>
            <h2 className="mt-2 text-xl font-black tracking-tight md:text-2xl">
              Estadísticas deportivas del club
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/78">
              Navega por rendimiento global, jugadores, partidos y comparativas manteniendo los
              mismos filtros de temporada, equipo, competición y campo.
            </p>
          </div>

          <div className="min-w-0 p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Mapa del módulo</p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-foreground">
                  Elige qué quieres analizar
                </h3>
              </div>
              <div className="rounded-lg bg-primary/10 px-3 py-1.5 text-right">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-primary/70">Ahora viendo</p>
                <p className="text-sm font-black text-primary">{currentTab.label}</p>
              </div>
            </div>

            <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5" role="tablist" aria-label="Secciones de estadísticas">
              {TABS.map((item) => {
                const Icon = item.icon
                const active = tab === item.key

                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(item.key)}
                    className={cn(
                      'group grid min-w-0 gap-2 rounded-lg border p-2.5 text-left shadow-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'border-primary/35 bg-primary/5 ring-1 ring-primary/15'
                        : 'border-border bg-white hover:border-primary/25 hover:bg-blue-50/20',
                    )}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_32px] items-start gap-2">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'text-[0.66rem] font-black uppercase tracking-[0.16em]',
                            item.tone === 'green' && 'text-emerald-700',
                            item.tone === 'amber' && 'text-amber-700',
                            item.tone === 'slate' && 'text-slate-600',
                            item.tone === 'blue' && 'text-primary',
                          )}
                        >
                          {item.eyebrow}
                        </p>
                        <p className="mt-1 truncate text-base font-black text-foreground">{item.label}</p>
                      </div>
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-lg',
                          item.tone === 'green' && 'bg-emerald-100 text-emerald-700',
                          item.tone === 'amber' && 'bg-amber-100 text-amber-700',
                          item.tone === 'slate' && 'bg-slate-100 text-slate-700',
                          item.tone === 'blue' && 'bg-primary/10 text-primary',
                        )}
                        aria-hidden="true"
                      >
                        <Icon className="size-3.5" />
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold leading-4 text-muted-foreground">{item.description}</p>
                    <span className={cn('inline-flex items-center gap-1 text-[11px] font-black', active ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')}>
                      {active ? 'Sección activa' : 'Entrar'}
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white/86 p-4 shadow-sm backdrop-blur">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
              <ListFilter className="size-4" aria-hidden="true" />
              Filtros de análisis
            </div>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              {activeTeamName} · {seasonId === 'all' ? 'Todas las temporadas' : seasons.find((season) => season.id === seasonId)?.name ?? 'Temporada seleccionada'} · {filteredMatches.length} partidos
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {matchType === 'all' ? 'Todos los tipos' : matchType === 'league' ? 'Liga' : 'Amistoso'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
              <Trophy className="size-3.5" aria-hidden="true" />
              {location === 'all' ? 'Local y visitante' : location === 'home' ? 'Solo local' : 'Solo visitante'}
            </span>
          </div>
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

      {filteredMatches.length === 0 ? (
        <EmptyState text="No hay partidos con los filtros seleccionados." />
      ) : null}

      {tab === 'summary' && filteredMatches.length > 0 ? (
        <div className="space-y-4">
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatPill label="Partidos jugados" value={summary.played} detail={`${filteredMatches.length} partidos en el filtro`} tone="blue" />
            <StatPill label="Balance" value={`${summary.wins}V · ${summary.draws}E · ${summary.losses}D`} detail={`${formatPercent(summary.wins, summary.played)} de victorias`} tone="green" />
            <StatPill label="Goles" value={`${summary.goalsFor} - ${summary.goalsAgainst}`} detail={`Diferencia ${summary.goalDifference >= 0 ? '+' : ''}${summary.goalDifference}`} tone={summary.goalDifference >= 0 ? 'green' : 'red'} />
            <StatPill label="Puntos estimados" value={summary.points} detail={`${formatDecimal(summary.pointsAverage)} por partido`} tone="amber" />
          </section>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatPill label="Media goleadora" value={formatDecimal(summary.goalsForAverage)} detail="Goles a favor por partido" />
            <StatPill label="Media encajada" value={formatDecimal(summary.goalsAgainstAverage)} detail="Goles recibidos por partido" />
            <StatPill label="Portería a cero" value={summary.cleanSheets} detail={`${formatPercent(summary.cleanSheets, summary.played)} de partidos jugados`} />
            <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-foreground/10">
              <p className="text-[11px] font-bold uppercase text-muted-foreground">Racha últimos 5</p>
              <div className="mt-2 flex gap-1.5">
                {summary.form.length > 0 ? (
                  summary.form.map((result, index) => (
                    <span
                      key={`${result}-${index}`}
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg text-sm font-black',
                        result === 'V' && 'bg-emerald-100 text-emerald-700',
                        result === 'E' && 'bg-amber-100 text-amber-700',
                        result === 'D' && 'bg-red-100 text-red-700',
                      )}
                    >
                      {result}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-semibold text-muted-foreground">Sin partidos jugados</span>
                )}
              </div>
            </div>
          </section>

          <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
            <div className="min-w-0 rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">Clasificación interna</h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                  {teamSummaries.length} equipos
                </span>
              </div>
              <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-white">
                <div className="grid min-w-[414px] grid-cols-[32px_1fr_repeat(5,54px)] gap-2 bg-muted/50 px-3 py-2 text-[10px] font-black uppercase text-muted-foreground">
                  <span>#</span>
                  <span>Equipo</span>
                  <span className="text-center">PJ</span>
                  <span className="text-center">V</span>
                  <span className="text-center">GF</span>
                  <span className="text-center">GC</span>
                  <span className="text-center">PTS</span>
                </div>
                {teamSummaries.length > 0 ? (
                  teamSummaries.map((team, index) => (
                    <div key={team.id} className="grid min-w-[414px] grid-cols-[32px_1fr_repeat(5,54px)] gap-2 border-t border-border px-3 py-2 text-sm">
                      <span className="font-black text-muted-foreground">{index + 1}</span>
                      <span className="truncate font-black text-foreground">{team.name}</span>
                      <span className="text-center font-semibold text-muted-foreground">{team.played}</span>
                      <span className="text-center font-semibold text-muted-foreground">{team.wins}</span>
                      <span className="text-center font-semibold text-muted-foreground">{team.goalsFor}</span>
                      <span className="text-center font-semibold text-muted-foreground">{team.goalsAgainst}</span>
                      <span className="text-center font-black text-primary">{team.points}</span>
                    </div>
                  ))
                ) : (
                  <p className="border-t border-border px-3 py-6 text-center text-sm font-semibold text-muted-foreground">
                    No hay equipos con partidos jugados.
                  </p>
                )}
              </div>
            </div>

            <div className="grid min-w-0 gap-3">
              <StatPill
                label="Mejor ataque"
                value={bestAttack?.name ?? '-'}
                detail={bestAttack ? `${formatDecimal(bestAttack.goalsFor / Math.max(1, bestAttack.played))} goles por partido` : 'Sin datos'}
                tone="green"
              />
              <StatPill
                label="Mejor defensa"
                value={bestDefense?.name ?? '-'}
                detail={bestDefense ? `${formatDecimal(bestDefense.goalsAgainst / Math.max(1, bestDefense.played))} goles encajados por partido` : 'Sin datos'}
                tone="blue"
              />
            </div>
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

          <section className="grid gap-4 xl:grid-cols-3">
            <RankingCard
              title="Top goleadores"
              items={topScorers.map((player) => ({
                id: player.athleteId,
                label: player.athleteName,
                value: player.goals,
                detail: `${player.teamName} · ${player.assists} asist.`,
              }))}
            />
            <RankingCard
              title="Top asistentes"
              items={topAssistants.map((player) => ({
                id: player.athleteId,
                label: player.athleteName,
                value: player.assists,
                detail: `${player.teamName} · ${player.goals} goles`,
              }))}
            />
            <RankingCard
              title="Más minutos"
              items={topMinutes.map((player) => ({
                id: player.athleteId,
                label: player.athleteName,
                value: `${player.minutes}'`,
                detail: `${player.teamName} · ${player.starts} titularidades`,
              }))}
            />
          </section>
        </div>
      ) : null}

      {tab === 'teams' && filteredMatches.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.62fr)]">
          <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Rendimiento por equipo</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Lectura de plantilla</h2>
              </div>
              <FilterSelect label="Equipo" value={selectedTeamAnalysis?.id ?? ''} onChange={setTeamFocusId} compact>
                {teamAnalysisRows.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </FilterSelect>
            </div>

            {selectedTeamAnalysis ? (
              <>
                <div className="mt-5 rounded-xl border border-primary/20 bg-primary p-5 text-primary-foreground">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">Equipo seleccionado</p>
                      <h3 className="mt-2 text-3xl font-black tracking-tight">{selectedTeamAnalysis.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-white/75">
                        {selectedTeamAnalysis.played} jugados · {selectedTeamAnalysis.totalMatches} partidos en el filtro
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/12 px-4 py-3 text-right">
                      <p className="text-xs font-black uppercase text-white/70">Puntos</p>
                      <p className="text-3xl font-black">{selectedTeamAnalysis.points}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-4">
                    <div className="rounded-lg bg-white/12 px-3 py-3">
                      <p className="text-2xl font-black">{selectedTeamAnalysis.winRate}</p>
                      <p className="text-[0.68rem] font-black uppercase tracking-wide text-white/70">Victorias</p>
                    </div>
                    <div className="rounded-lg bg-white/12 px-3 py-3">
                      <p className="text-2xl font-black">{selectedTeamAnalysis.goalsFor}-{selectedTeamAnalysis.goalsAgainst}</p>
                      <p className="text-[0.68rem] font-black uppercase tracking-wide text-white/70">Goles</p>
                    </div>
                    <div className="rounded-lg bg-white/12 px-3 py-3">
                      <p className="text-2xl font-black">{selectedTeamAnalysis.goalDifference >= 0 ? '+' : ''}{selectedTeamAnalysis.goalDifference}</p>
                      <p className="text-[0.68rem] font-black uppercase tracking-wide text-white/70">Diferencia</p>
                    </div>
                    <div className="rounded-lg bg-white/12 px-3 py-3">
                      <div className="flex gap-1">
                        {selectedTeamAnalysis.form.length > 0 ? (
                          selectedTeamAnalysis.form.map((result, index) => (
                            <span key={`${result}-${index}`} className="flex size-7 items-center justify-center rounded bg-white/16 text-xs font-black">
                              {result}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm font-semibold text-white/70">Sin racha</span>
                        )}
                      </div>
                      <p className="mt-1 text-[0.68rem] font-black uppercase tracking-wide text-white/70">Racha</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <StatPill label="Goles por partido" value={formatDecimal(selectedTeamAnalysis.goalsForAverage)} />
                  <StatPill label="Encajados por partido" value={formatDecimal(selectedTeamAnalysis.goalsAgainstAverage)} />
                  <StatPill label="Puntos por partido" value={formatDecimal(selectedTeamPointsAverage)} />
                  <StatPill label="Portería a cero" value={selectedTeamCleanSheets} detail={`${formatPercent(selectedTeamCleanSheets, selectedTeamAnalysis.played)} de partidos`} />
                  <StatPill label="Disparos totales" value={selectedTeamAnalysis.totalShots} />
                  <StatPill label="Posesión media" value={formatNumber(selectedTeamAnalysis.possession, '%')} />
                  <StatPill label="Tarjetas" value={selectedTeamAnalysis.cards} tone={selectedTeamAnalysis.cards > 0 ? 'amber' : 'default'} />
                  <StatPill label="Local / Visitante" value={`${selectedTeamHomeMatches.length} / ${selectedTeamAwayMatches.length}`} />
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-4">
                  {statGroups.map((group) => (
                    <div key={group} className="rounded-lg border border-border bg-white p-4">
                      <h3 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">{group}</h3>
                      <div className="mt-3 divide-y divide-border">
                        {TEAM_STATS.filter((stat) => stat.group === group).map((stat) => (
                          <div key={stat.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                            <span className="font-semibold text-muted-foreground">{stat.label}</span>
                            <span className="font-black text-foreground">
                              {formatNumber(
                                aggregateStat(selectedTeamMatches, stat, 'club'),
                                stat.suffix,
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <RankingCard
                    title="Jugadores más determinantes"
                    items={selectedTeamPlayers.map((player) => ({
                      id: player.athleteId,
                      label: player.athleteName,
                      value: player.goals + player.assists,
                      detail: `${player.goals} goles · ${player.assists} asist. · ${player.minutes}'`,
                    }))}
                  />

                  <div className="rounded-lg bg-white p-4 ring-1 ring-foreground/10">
                    <h3 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">Últimos partidos</h3>
                    <div className="mt-3 space-y-2">
                      {selectedTeamMatches.slice(0, 6).map((match) => (
                        <div key={match.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-foreground">{match.opponentName}</p>
                            <p className="text-xs font-semibold text-muted-foreground">{match.dateLabel} · {match.isHome ? 'Local' : 'Visitante'}</p>
                          </div>
                          <span className="rounded-lg bg-muted px-2 py-1 text-sm font-black text-foreground">
                            {formatNumber(getClubScore(match))}-{formatNumber(getOpponentScore(match))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState text="No hay equipos con partidos jugados en estos filtros." />
            )}
          </div>

          <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Entrenamientos</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-foreground">Asistencia</h2>
              </div>
              <span className="rounded-lg bg-primary/10 px-2 py-1 text-sm font-black text-primary">
                {selectedTeamTrainings.length}
              </span>
            </div>

            {selectedTeamAnalysis && selectedTeamTrainings.length > 0 ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-primary/15 bg-primary p-4 text-primary-foreground">
                  <p className="text-xs font-black uppercase text-white/70">Ratio asistencia</p>
                  <p className="mt-1 text-3xl font-black">{selectedTeamAttendanceRate}</p>
                  <p className="mt-1 text-xs font-semibold text-white/75">
                    Incluye asistidos y llegadas tarde
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ATTENDANCE_LABELS).map(([status, label]) => (
                    <div key={status} className="rounded-lg bg-white px-3 py-2 ring-1 ring-foreground/10">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
                      <p className="mt-1 text-xl font-black text-foreground">
                        {selectedTeamAttendanceCounts[status as TrainingAttendanceStatus]}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.12em] text-foreground">Últimas sesiones</h3>
                  <div className="mt-2 space-y-2">
                    {selectedTeamTrainings.slice(0, 5).map((training) => {
                      const total = training.attendance.filter((row) => Boolean(row.status)).length
                      const positive = training.attendance.filter((row) => row.status === 'attended' || row.status === 'late').length

                      return (
                        <div key={training.id} className="rounded-lg border border-border bg-white px-3 py-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-foreground">{training.dateLabel}</p>
                              <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
                                {training.timeLabel} · {training.location}
                              </p>
                            </div>
                            <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-black text-primary">
                              {formatPercent(positive, total)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm font-semibold text-muted-foreground">
                Sin entrenamientos con asistencia en este filtro.
              </div>
            )}
          </div>

        </section>
      ) : null}

      {tab === 'players' && filteredMatches.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {selectedPlayer ? (
              <>
                <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
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
                </div>

                <div className="rounded-xl border border-primary/15 bg-white/90 p-4 ring-1 ring-foreground/5">
                  <div className="grid gap-3 md:grid-cols-[1fr_360px]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Por partido</p>
                        <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">{selectedPlayer.athleteName}</h2>
                        <p className="text-sm font-semibold text-muted-foreground">
                          {selectedPlayer.teamName} · {getPlayerPositionLabel(selectedPlayer.position)}
                        </p>
                      </div>
                      <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
                        {selectedPlayerMatchId === 'all' ? 'Temporada filtrada' : 'Partido'}
                      </span>
                    </div>
                    <FilterSelect label="Partido" value={selectedPlayerMatchId} onChange={setSelectedPlayerMatchId}>
                      <option value="all">Todos los partidos</option>
                      {selectedPlayer.matchRows.map(({ match }) => (
                        <option key={match.id} value={match.id}>
                          {getMatchDisplayLabel(match)}
                        </option>
                      ))}
                    </FilterSelect>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                    <StatPill label="Minutos" value={`${selectedPlayerStats.minutes}'`} detail={`${selectedPlayerStats.callups} convocatorias`} tone="blue" />
                    <StatPill label="Goles" value={selectedPlayerStats.goals} detail={`${formatDecimal(selectedPlayerAdvanced.goalsPer100)} cada 100 min`} tone="green" />
                    <StatPill label="Asistencias" value={selectedPlayerStats.assists} detail={`${formatDecimal(selectedPlayerAdvanced.assistsPer100)} cada 100 min`} tone="green" />
                    <StatPill label="Aportación directa" value={selectedPlayerAdvanced.goalContributions} detail="Goles + asistencias" tone="amber" />
                    <StatPill label="Titularidades" value={selectedPlayerStats.starts} detail={`${selectedPlayerAdvanced.starterRate} de convocatorias`} />
                    <StatPill label="Tiros" value={selectedPlayerStats.shots} detail={`${selectedPlayerAdvanced.shotEfficiency} de eficacia`} />
                    <StatPill label="Amarillas" value={selectedPlayerStats.yellowCards} />
                    <StatPill label="Rojas" value={selectedPlayerStats.redCards} tone={selectedPlayerStats.redCards > 0 ? 'red' : 'default'} />
                  </div>

                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    <StatPill label="Paradas" value={selectedPlayerStats.saves} />
                    <StatPill label="Faltas cometidas" value={selectedPlayerStats.foulsCommitted} />
                    <StatPill label="Faltas recibidas" value={selectedPlayerStats.foulsReceived} />
                    <StatPill label="Partidos en el filtro" value={selectedPlayerRows.length} />
                  </div>
                </div>

                <div className="rounded-xl border border-primary/15 bg-white/90 p-4 ring-1 ring-foreground/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Entrenamientos</p>
                      <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">Asistencia del jugador</h3>
                    </div>
                    <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-black text-primary">
                      {selectedPlayer.trainingAttendanceRate}%
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
                    <StatPill label="Sesiones" value={selectedPlayer.trainingSessions} />
                    <StatPill label="Asistido" value={selectedPlayer.trainingAttended} tone="green" />
                    <StatPill label="Tarde" value={selectedPlayer.trainingLate} tone="blue" />
                    <StatPill label="Justificadas" value={selectedPlayer.trainingJustifiedAbsences} tone="amber" />
                    <StatPill label="Injustificadas" value={selectedPlayer.trainingUnjustifiedAbsences} tone="red" />
                  </div>
                </div>

                <div className="rounded-xl border border-primary/15 bg-white/90 p-4 ring-1 ring-foreground/5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Evolución</p>
                      <h3 className="mt-1 text-xl font-black tracking-tight text-foreground">Evolución por partido</h3>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">Últimos 8 registros</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {selectedPlayerRows.slice(0, 8).map(({ match, stat }) => (
                      <div key={match.id} className="rounded-lg border border-border bg-white px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-foreground">{match.dateLabel} · {match.opponentName}</p>
                          <span className="text-xs font-black text-muted-foreground">{stat.minutes}&apos;</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {stat.goals} goles · {stat.assists} asist. · {stat.shots} tiros · {stat.yellowCards} amarillas · {stat.redCards} rojas
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
                <EmptyState text="No hay estadísticas individuales con estos filtros." />
              </div>
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
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-foreground">{player.athleteName}</span>
                    <span className="block truncate text-[11px] font-semibold text-muted-foreground">{player.teamName}</span>
                  </span>
                  <span className="rounded-lg bg-muted px-2 py-1 text-sm font-black text-foreground">
                    {playerMetric === 'trainingAttendanceRate' ? `${player[playerMetric]}%` : player[playerMetric]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'matches' && filteredMatches.length > 0 ? (
        <section className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Acta estadística</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Detalle del partido</h2>
            </div>
            <FilterSelect label="Partido" value={selectedMatch?.id ?? ''} onChange={setSelectedMatchId} compact>
              {filteredMatches.map((match) => (
                <option key={match.id} value={match.id}>
                  {getMatchDisplayLabel(match)}
                </option>
              ))}
            </FilterSelect>
          </div>

          {selectedMatch ? (
            <div className="mt-4 space-y-4">
              <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary text-primary-foreground">
                <div className="grid gap-0 lg:grid-cols-[1fr_auto_1fr]">
                  <div className="p-5 text-right">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/65">
                      {selectedMatch.isHome ? CLUB.shortName : 'Rival'}
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight">
                      {selectedMatch.isHome ? selectedMatch.teamName : selectedMatch.opponentName}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-white/70">
                      {selectedMatch.isHome ? 'Local' : 'Visitante'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center border-y border-white/15 px-8 py-5 lg:border-x lg:border-y-0">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/65">{selectedMatch.dateLabel}</p>
                    <p className="mt-2 text-5xl font-black leading-none">
                      {formatNumber(selectedMatch.homeScore)} - {formatNumber(selectedMatch.awayScore)}
                    </p>
                    <span
                      className={cn(
                        'mt-3 rounded-full px-3 py-1 text-xs font-black uppercase',
                        selectedMatchResult === 'V' && 'bg-emerald-100 text-emerald-700',
                        selectedMatchResult === 'E' && 'bg-amber-100 text-amber-700',
                        selectedMatchResult === 'D' && 'bg-red-100 text-red-700',
                        !selectedMatchResult && 'bg-white/12 text-white/75',
                      )}
                    >
                      {selectedMatchResult === 'V'
                        ? 'Victoria'
                        : selectedMatchResult === 'E'
                          ? 'Empate'
                          : selectedMatchResult === 'D'
                            ? 'Derrota'
                            : 'Sin resultado'}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/65">
                      {selectedMatch.isHome ? 'Rival' : CLUB.shortName}
                    </p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight">
                      {selectedMatch.isHome ? selectedMatch.opponentName : selectedMatch.teamName}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-white/70">
                      {selectedMatch.matchType === 'league' ? 'Liga' : 'Amistoso'} · {selectedMatch.roundLabel || selectedMatch.location || 'Sin jornada'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <StatPill label="Convocados" value={selectedMatchSummary?.calledUp ?? 0} />
                <StatPill label="Titulares" value={selectedMatchSummary?.starters ?? 0} />
                <StatPill label="Suplentes" value={selectedMatchSummary?.substitutes ?? 0} />
                <StatPill label="Goles acta" value={selectedMatchSummary?.playerGoals ?? 0} tone="green" />
                <StatPill label="Tarjetas" value={selectedMatchSummary?.cards ?? 0} tone={(selectedMatchSummary?.cards ?? 0) > 0 ? 'amber' : 'default'} />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.58fr)_minmax(720px,1.42fr)]">
              <div className="rounded-lg border border-border bg-white">
                <div className="border-b border-border px-4 py-3">
                  <h3 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">Comparativa club-rival</h3>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">Lectura de métricas del partido seleccionado.</p>
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">Jugadores del partido</h3>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">Aportación individual registrada en el acta.</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                    {selectedMatchPlayerStats.length} visibles
                  </span>
                </div>

                {selectedMatchFeaturedPlayers.length > 0 ? (
                  <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                    {selectedMatchFeaturedPlayers.map((stat) => (
                      <div key={stat.athleteId} className="rounded-lg border border-border bg-muted/25 px-3 py-2">
                        <p className="truncate text-sm font-black text-foreground">{stat.athleteName}</p>
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                          {stat.minutes}&apos; · {getPlayerPositionLabel(stat.position)}
                        </p>
                        <p className="mt-2 text-xs font-black text-primary">
                          {stat.goals} G · {stat.assists} A · {stat.shots} tiros
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

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
                                {stat.minutes}&apos;
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
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === 'compare' && filteredMatches.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.52fr)]">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
              <div className="grid gap-2 md:grid-cols-3" role="tablist" aria-label="Tipos de comparativa">
                {[
                  { id: 'teams' as const, label: 'Equipos', detail: 'Equipo contra equipo' },
                  { id: 'players' as const, label: 'Jugadores', detail: 'Jugador contra jugador' },
                  { id: 'history' as const, label: 'Histórico', detail: 'Mismo equipo por temporadas' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={compareTab === item.id}
                    onClick={() => setCompareTab(item.id)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      compareTab === item.id
                        ? 'border-primary/35 bg-primary text-white shadow-sm'
                        : 'border-border bg-white text-foreground hover:border-primary/25 hover:bg-primary/5',
                    )}
                  >
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className={cn('mt-0.5 block text-xs font-semibold', compareTab === item.id ? 'text-white/75' : 'text-muted-foreground')}>
                      {item.detail}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {compareTab === 'teams' ? (
            <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Comparativa de equipos</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Equipo contra equipo</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <FilterSelect label="Equipo A" value={compareA} onChange={setCompareA} compact>
                    {teams.map((team) => <option key={team.id} value={team.id}>{team.nombre}</option>)}
                  </FilterSelect>
                  <FilterSelect label="Equipo B" value={compareB} onChange={setCompareB} compact>
                    {teams.map((team) => <option key={team.id} value={team.id}>{team.nombre}</option>)}
                  </FilterSelect>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {compareTeams.map((team) => (
                  <div key={team.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-foreground">{team.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-muted-foreground">
                          {team.wins}V · {team.draws}E · {team.losses}D
                        </p>
                      </div>
                      <span className="rounded-lg bg-primary/10 px-3 py-1 text-lg font-black text-primary">{team.points}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <StatPill label="Jugados" value={team.played} />
                      <StatPill label="Diferencia" value={`${team.goalDifference >= 0 ? '+' : ''}${team.goalDifference}`} tone={team.goalDifference >= 0 ? 'green' : 'red'} />
                      <StatPill label="Goles" value={`${team.goalsFor}-${team.goalsAgainst}`} />
                      <StatPill label="Goles/partido" value={formatDecimal(team.goalsForAverage)} />
                      <StatPill label="Encajados/partido" value={formatDecimal(team.goalsAgainstAverage)} />
                      <StatPill label="Disparos" value={team.shots} />
                      <StatPill label="Posesión" value={formatNumber(team.possession, '%')} />
                      <StatPill label="Tarjetas" value={team.cards} tone={team.cards > 0 ? 'amber' : 'default'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            ) : null}

            {compareTab === 'players' ? (
            <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Comparativa individual</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Jugador contra jugador</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <FilterSelect label="Jugador A" value={comparePlayerLeft?.athleteId ?? ''} onChange={setComparePlayerA} compact>
                    {playerOptions.map((player) => <option key={player.athleteId} value={player.athleteId}>{player.athleteName}</option>)}
                  </FilterSelect>
                  <FilterSelect label="Jugador B" value={comparePlayerRight?.athleteId ?? ''} onChange={setComparePlayerB} compact>
                    {playerOptions.map((player) => <option key={player.athleteId} value={player.athleteId}>{player.athleteName}</option>)}
                  </FilterSelect>
                </div>
              </div>

              {comparePlayerLeft && comparePlayerRight ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {[comparePlayerLeft, comparePlayerRight].map((player) => (
                    <div key={player.athleteId} className="rounded-xl border border-border bg-white p-4">
                      <h3 className="text-lg font-black tracking-tight text-foreground">{player.athleteName}</h3>
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">{player.teamName} · {getPlayerPositionLabel(player.position)}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <StatPill label="Minutos" value={`${player.minutes}'`} />
                        <StatPill label="Conv." value={player.callups} />
                        <StatPill label="Titular" value={player.starts} />
                        <StatPill label="Goles" value={player.goals} tone="green" />
                        <StatPill label="Asist." value={player.assists} tone="green" />
                        <StatPill label="G+A" value={player.goals + player.assists} tone="amber" />
                        <StatPill label="Tiros" value={player.shots} />
                        <StatPill label="Tarjetas" value={player.yellowCards + player.redCards} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No hay jugadores suficientes para comparar." />
              )}
            </div>
            ) : null}

            {compareTab === 'history' ? (
            <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Comparativa histórica</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Mismo equipo en distintas temporadas</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <FilterSelect label="Equipo" value={compareSeasonTeamName} onChange={setCompareSeasonTeamName} compact>
                    {teamNameOptions.map((teamName) => <option key={teamName} value={teamName}>{teamName}</option>)}
                  </FilterSelect>
                  <FilterSelect label="Temporada A" value={seasonCompareA} onChange={setCompareSeasonA} compact>
                    {seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
                  </FilterSelect>
                  <FilterSelect label="Temporada B" value={seasonCompareB} onChange={setCompareSeasonB} compact>
                    {seasons.map((season) => <option key={season.id} value={season.id}>{season.name}</option>)}
                  </FilterSelect>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {compareSeasonRows.map((season) => (
                  <div key={season.id} className="rounded-xl border border-border bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-foreground">{season.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-muted-foreground">
                          {compareSeasonTeamName || 'Equipo'} · {season.matches} partidos en filtro
                        </p>
                      </div>
                      <span className="rounded-lg bg-primary/10 px-3 py-1 text-lg font-black text-primary">{season.points}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <StatPill label="Jugados" value={season.played} />
                      <StatPill label="Balance" value={`${season.wins}V · ${season.draws}E · ${season.losses}D`} />
                      <StatPill label="Goles" value={`${season.goalsFor}-${season.goalsAgainst}`} />
                      <StatPill label="Diferencia" value={`${season.goalDifference >= 0 ? '+' : ''}${season.goalDifference}`} tone={season.goalDifference >= 0 ? 'green' : 'red'} />
                      <StatPill label="Puntos/partido" value={formatDecimal(season.pointsAverage)} />
                      <StatPill label="Victorias" value={formatPercent(season.wins, season.played)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            ) : null}
          </div>

          <div className="rounded-lg bg-white/85 p-4 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase text-foreground">
                <Medal className="size-4 text-primary" aria-hidden="true" />
                Ranking rápido
              </h2>
              <FilterSelect label="Métrica" value={playerMetric} onChange={(value) => setPlayerMetric(value as PlayerMetricKey)} compact>
                {PLAYER_METRICS.map((metric) => (
                  <option key={metric.key} value={metric.key}>{metric.label}</option>
                ))}
              </FilterSelect>
            </div>
            <div className="mt-4 space-y-3">
              {playerSummaries.slice(0, 10).map((player, index) => (
                <div key={player.athleteId}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate font-bold text-foreground">{index + 1}. {player.athleteName}</span>
                    <span className="font-black text-foreground">
                      {playerMetric === 'trainingAttendanceRate' ? `${player[playerMetric]}%` : player[playerMetric]}
                    </span>
                  </div>
                  <p className="mb-1 truncate text-[11px] font-semibold text-muted-foreground">{player.teamName}</p>
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
    <label className={cn('grid min-w-0 gap-1', compact ? 'sm:min-w-56' : '')}>
      <span className="text-[11px] font-bold uppercase text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full min-w-0 rounded-lg border border-input bg-white px-3 text-sm font-semibold text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
