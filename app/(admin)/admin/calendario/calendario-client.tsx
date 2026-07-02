'use client'

import { useMemo, useState, useTransition } from 'react'
import { AlertTriangle, CalendarDays, ClipboardList, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CLUB } from '@/lib/club'
import type { AdminMatchPlayerStat, AdminMatchRow, AdminMatchStatus, AdminMatchType, AdminTeamRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import {
  createMatchAction as adminCreateMatchAction,
  deleteMatchAction as adminDeleteMatchAction,
  updateMatchAction as adminUpdateMatchAction,
} from './actions'

type Props = {
  matches: AdminMatchRow[]
  teams: AdminTeamRow[]
  actions?: CalendarActions
  emptyTeamsMessage?: string
}

type SheetMode = 'create' | 'edit'

type MatchFormState = {
  teamId: string
  opponentName: string
  matchDate: string
  matchTime: string
  location: string
  isHome: boolean
  matchType: AdminMatchType
  roundLabel: string
  status: AdminMatchStatus
  homeScore: string
  awayScore: string
  notes: string
}

type ColumnFilters = {
  week: string
  round: string
  date: string
  team: string
  opponent: string
  location: string
  type: string
  status: string
}

type ResultFormState = {
  clubScore: string
  opponentScore: string
  clubPossession: string
  opponentPossession: string
  clubOffsides: string
  opponentOffsides: string
  clubCorners: string
  opponentCorners: string
  clubTotalShots: string
  opponentTotalShots: string
  clubShots: string
  opponentShots: string
  clubShotsOnTarget: string
  opponentShotsOnTarget: string
  clubBlockedShots: string
  opponentBlockedShots: string
  clubGoalkeeperSaves: string
  opponentGoalkeeperSaves: string
  clubTackles: string
  opponentTackles: string
  clubPasses: string
  opponentPasses: string
  clubCompletedPasses: string
  opponentCompletedPasses: string
  clubFouls: string
  opponentFouls: string
  clubYellowCards: string
  opponentYellowCards: string
  clubRedCards: string
  opponentRedCards: string
}

type MatchPlayerPosition = 'goalkeeper' | 'defender' | 'midfielder' | 'forward'

type PlayerStatFormState = {
  athleteId: string
  athleteName: string
  position: MatchPlayerPosition | ''
  isCalledUp: boolean
  isStarter: boolean
  shirtNumber: string
  minutes: string
  goals: string
  goalMinutes: string
  assists: string
  foulsCommitted: string
  foulsReceived: string
  yellowCards: string
  yellowCardMinutes: string
  redCard: boolean
  redCardMinute: string
  shots: string
  saves: string
  notes: string
}

type PlayerStatActionInput = {
  athleteId: string
  position: MatchPlayerPosition | null
  isCalledUp: boolean
  isStarter: boolean
  shirtNumber: number | null
  minutes: number
  goals: number
  goalMinutes: string
  assists: number
  foulsCommitted: number
  foulsReceived: number
  yellowCards: number
  yellowCardMinutes: string
  redCards: number
  redCardMinute: number | null
  shots: number
  saves: number
  notes: string
}

type MatchActionInput = {
  teamId: string
  opponentName: string
  matchDate: string
  matchTime: string
  location: string
  isHome: boolean
  matchType: AdminMatchType
  roundLabel: string
  status: AdminMatchStatus
  homeScore: number | null
  awayScore: number | null
  homePossession?: number | null
  awayPossession?: number | null
  homeOffsides?: number | null
  awayOffsides?: number | null
  homeCorners?: number | null
  awayCorners?: number | null
  homeTotalShots?: number | null
  awayTotalShots?: number | null
  homeShots?: number | null
  awayShots?: number | null
  homeShotsOnTarget?: number | null
  awayShotsOnTarget?: number | null
  homeBlockedShots?: number | null
  awayBlockedShots?: number | null
  homeGoalkeeperSaves?: number | null
  awayGoalkeeperSaves?: number | null
  homeTackles?: number | null
  awayTackles?: number | null
  homePasses?: number | null
  awayPasses?: number | null
  homeCompletedPasses?: number | null
  awayCompletedPasses?: number | null
  homeFouls?: number | null
  awayFouls?: number | null
  homeYellowCards?: number | null
  awayYellowCards?: number | null
  homeRedCards?: number | null
  awayRedCards?: number | null
  playerStats?: PlayerStatActionInput[]
  notes: string
}

type CalendarActions = {
  createMatch: (input: MatchActionInput) => Promise<void>
  updateMatch: (input: MatchActionInput & { id: string }) => Promise<void>
  deleteMatch: (id: string) => Promise<void>
}

const STATUS_LABELS: Record<AdminMatchStatus, string> = {
  scheduled: 'Programado',
  played: 'Jugado',
  postponed: 'Aplazado',
  cancelled: 'Cancelado',
}

const STATUS_STYLES: Record<AdminMatchStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  played: 'bg-emerald-100 text-emerald-700',
  postponed: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-700',
}

const MATCH_TYPE_LABELS: Record<AdminMatchType, string> = {
  league: 'Liga',
  friendly: 'Amistoso',
}

const POSITION_OPTIONS: Array<{ value: PlayerStatFormState['position']; label: string }> = [
  { value: '', label: 'Sin posicion' },
  { value: 'goalkeeper', label: 'Portero' },
  { value: 'defender', label: 'Defensa' },
  { value: 'midfielder', label: 'Medio' },
  { value: 'forward', label: 'Delantero' },
]

function createEmptyForm(defaultTeamId = ''): MatchFormState {
  return {
    teamId: defaultTeamId,
    opponentName: '',
    matchDate: '',
    matchTime: '',
    location: '',
    isHome: true,
    matchType: 'league',
    roundLabel: '',
    status: 'scheduled',
    homeScore: '',
    awayScore: '',
    notes: '',
  }
}

function scoreToString(value: number | null) {
  return value === null ? '' : String(value)
}

function parseScore(value: string) {
  if (!value.trim()) return null
  return Number(value)
}

function parseOptionalStat(value: string) {
  if (!value.trim()) return null
  return Number(value)
}

function parseRequiredStat(value: string) {
  if (!value.trim()) return 0
  return Number(value)
}

function parseMinuteList(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return []

  return trimmed
    .split(',')
    .map((minute) => minute.trim())
    .filter(Boolean)
    .map(Number)
}

function normalizeMinuteList(value: string) {
  return parseMinuteList(value).join(', ')
}

function getMinuteFields(value: string, count: number) {
  const fields = value
    .split(',')
    .map((minute) => minute.trim())

  return Array.from({ length: count }, (_, index) => fields[index] ?? '')
}

function setMinuteField(value: string, count: number, index: number, minute: string) {
  const fields = getMinuteFields(value, count)
  fields[index] = minute

  return fields.join(', ')
}

function clampMinuteList(value: string, count: number) {
  return getMinuteFields(value, count).filter((field) => field.trim()).join(', ')
}

function playerStatToForm(stat: AdminMatchPlayerStat): PlayerStatFormState {
  return {
    athleteId: stat.athleteId,
    athleteName: stat.athleteName,
    position: stat.position ?? '',
    isCalledUp: stat.isCalledUp,
    isStarter: stat.isStarter,
    shirtNumber: stat.shirtNumber === null ? '' : String(stat.shirtNumber),
    minutes: stat.minutes ? String(stat.minutes) : '',
    goals: stat.goals ? String(stat.goals) : '',
    goalMinutes: stat.goalMinutes,
    assists: stat.assists ? String(stat.assists) : '',
    foulsCommitted: stat.foulsCommitted ? String(stat.foulsCommitted) : '',
    foulsReceived: stat.foulsReceived ? String(stat.foulsReceived) : '',
    yellowCards: stat.yellowCards ? String(stat.yellowCards) : '',
    yellowCardMinutes: stat.yellowCardMinutes,
    redCard: stat.redCards > 0 || stat.yellowCards >= 2,
    redCardMinute: stat.redCardMinute === null ? '' : String(stat.redCardMinute),
    shots: stat.shots ? String(stat.shots) : '',
    saves: stat.position === 'goalkeeper' && stat.saves ? String(stat.saves) : '',
    notes: stat.notes,
  }
}

function getScoreLabel(match: AdminMatchRow) {
  if (match.status !== 'played' || match.homeScore === null || match.awayScore === null) {
    return '-'
  }

  const clubScore = match.isHome ? match.homeScore : match.awayScore
  const opponentScore = match.isHome ? match.awayScore : match.homeScore

  return `${clubScore} - ${opponentScore}`
}

function getStatNumber(value: string) {
  return value.trim() ? Number(value) : 0
}

function getStatWidths(leftValue: string, rightValue: string) {
  const left = getStatNumber(leftValue)
  const right = getStatNumber(rightValue)
  const total = left + right

  if (total === 0) {
    return { left: 50, right: 50 }
  }

  return {
    left: Math.max(8, Math.round((left / total) * 100)),
    right: Math.max(8, Math.round((right / total) * 100)),
  }
}

function getAutoTotalShots(form: ResultFormState, side: 'club' | 'opponent') {
  if (side === 'club') {
    return parseRequiredStat(form.clubShots) + parseRequiredStat(form.clubShotsOnTarget) + parseRequiredStat(form.clubBlockedShots)
  }

  return (
    parseRequiredStat(form.opponentShots) +
    parseRequiredStat(form.opponentShotsOnTarget) +
    parseRequiredStat(form.opponentBlockedShots)
  )
}

export function CalendarioClient({
  matches,
  teams,
  actions,
  emptyTeamsMessage = 'Crea al menos un equipo antes de programar partidos.',
}: Props) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ColumnFilters>({
    week: '',
    round: '',
    date: '',
    team: '',
    opponent: '',
    location: '',
    type: '',
    status: '',
  })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [mode, setMode] = useState<SheetMode>('create')
  const [editing, setEditing] = useState<AdminMatchRow | null>(null)
  const [resultMatch, setResultMatch] = useState<AdminMatchRow | null>(null)
  const [resultForm, setResultForm] = useState<ResultFormState>({
    clubScore: '',
    opponentScore: '',
    clubPossession: '',
    opponentPossession: '',
    clubOffsides: '',
    opponentOffsides: '',
    clubCorners: '',
    opponentCorners: '',
    clubTotalShots: '',
    opponentTotalShots: '',
    clubShots: '',
    opponentShots: '',
    clubShotsOnTarget: '',
    opponentShotsOnTarget: '',
    clubBlockedShots: '',
    opponentBlockedShots: '',
    clubGoalkeeperSaves: '',
    opponentGoalkeeperSaves: '',
    clubTackles: '',
    opponentTackles: '',
    clubPasses: '',
    opponentPasses: '',
    clubCompletedPasses: '',
    opponentCompletedPasses: '',
    clubFouls: '',
    opponentFouls: '',
    clubYellowCards: '',
    opponentYellowCards: '',
    clubRedCards: '',
    opponentRedCards: '',
  })
  const [resultTab, setResultTab] = useState<'summary' | 'players'>('summary')
  const [playerForm, setPlayerForm] = useState<PlayerStatFormState[]>([])
  const [eventPlayerId, setEventPlayerId] = useState<string | null>(null)
  const [statWarnings, setStatWarnings] = useState<string[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<MatchFormState>(() => createEmptyForm(teams[0]?.id ?? ''))
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const calendarActions = actions ?? {
    createMatch: adminCreateMatchAction,
    updateMatch: adminUpdateMatchAction,
    deleteMatch: adminDeleteMatchAction,
  }

  const activeTeams = useMemo(
    () => teams.filter((team) => team.isActive),
    [teams],
  )
  const selectableTeams = activeTeams.length > 0 ? activeTeams : teams
  const weekOptions = useMemo(
    () => Array.from(new Set(matches.map((match) => `${match.weekLabel}|${match.weekRangeLabel}`))),
    [matches],
  )

  const filteredMatches = matches.filter((match) => {
    const q = search.toLowerCase().trim()
    const searchable = [
      match.weekLabel,
      match.weekRangeLabel,
      match.dateLabel,
      match.timeLabel,
      match.teamName,
      match.categoryName,
      CLUB.shortName,
      match.opponentName,
      match.location,
      MATCH_TYPE_LABELS[match.matchType],
      match.roundLabel,
      STATUS_LABELS[match.status],
      getScoreLabel(match),
    ].join(' ').toLowerCase()

    if (q && !searchable.includes(q)) return false
    if (filters.week && `${match.weekLabel}|${match.weekRangeLabel}` !== filters.week) return false
    if (filters.round && !match.roundLabel.toLowerCase().includes(filters.round.toLowerCase())) return false
    if (filters.date && !match.dateLabel.toLowerCase().includes(filters.date.toLowerCase())) return false
    if (filters.team && match.teamId !== filters.team) return false
    if (filters.opponent && !match.opponentName.toLowerCase().includes(filters.opponent.toLowerCase())) return false
    if (filters.location && !match.location.toLowerCase().includes(filters.location.toLowerCase())) return false
    if (filters.type && match.matchType !== filters.type) return false
    if (filters.status && match.status !== filters.status) return false

    return true
  })

  const hasColumnFilters = Object.values(filters).some(Boolean)

  function setField<K extends keyof MatchFormState>(field: K, value: MatchFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function setFilter<K extends keyof ColumnFilters>(field: K, value: ColumnFilters[K]) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function clearFilters() {
    setSearch('')
    setFilters({
      week: '',
      round: '',
      date: '',
      team: '',
      opponent: '',
      location: '',
      type: '',
      status: '',
    })
  }

  function openCreate() {
    setMode('create')
    setEditing(null)
    setDeleteId(null)
    setForm(createEmptyForm(selectableTeams[0]?.id ?? ''))
    setFormError(null)
    setSheetOpen(true)
  }

  function openEdit(match: AdminMatchRow) {
    setMode('edit')
    setEditing(match)
    setDeleteId(null)
    setForm({
      teamId: match.teamId,
      opponentName: match.opponentName,
      matchDate: match.matchDate,
      matchTime: match.matchTime,
      location: match.location,
      isHome: match.isHome,
      matchType: match.matchType,
      roundLabel: match.roundLabel,
      status: match.status,
      homeScore: scoreToString(match.homeScore),
      awayScore: scoreToString(match.awayScore),
      notes: match.notes,
    })
    setFormError(null)
    setSheetOpen(true)
  }

  function openResult(match: AdminMatchRow) {
    setSheetOpen(false)
    setDeleteId(null)
    setResultMatch(match)
    setResultTab('summary')
    setPlayerForm(match.playerStats.map(playerStatToForm))
    setResultForm({
      clubScore: match.status === 'played'
        ? scoreToString(match.isHome ? match.homeScore : match.awayScore)
        : '',
      opponentScore: match.status === 'played'
        ? scoreToString(match.isHome ? match.awayScore : match.homeScore)
        : '',
      clubPossession: scoreToString(match.isHome ? match.homePossession : match.awayPossession),
      opponentPossession: scoreToString(match.isHome ? match.awayPossession : match.homePossession),
      clubOffsides: scoreToString(match.isHome ? match.homeOffsides : match.awayOffsides),
      opponentOffsides: scoreToString(match.isHome ? match.awayOffsides : match.homeOffsides),
      clubCorners: scoreToString(match.isHome ? match.homeCorners : match.awayCorners),
      opponentCorners: scoreToString(match.isHome ? match.awayCorners : match.homeCorners),
      clubTotalShots: scoreToString(match.isHome ? match.homeTotalShots : match.awayTotalShots),
      opponentTotalShots: scoreToString(match.isHome ? match.awayTotalShots : match.homeTotalShots),
      clubShots: scoreToString(match.isHome ? match.homeShots : match.awayShots),
      opponentShots: scoreToString(match.isHome ? match.awayShots : match.homeShots),
      clubShotsOnTarget: scoreToString(match.isHome ? match.homeShotsOnTarget : match.awayShotsOnTarget),
      opponentShotsOnTarget: scoreToString(match.isHome ? match.awayShotsOnTarget : match.homeShotsOnTarget),
      clubBlockedShots: scoreToString(match.isHome ? match.homeBlockedShots : match.awayBlockedShots),
      opponentBlockedShots: scoreToString(match.isHome ? match.awayBlockedShots : match.homeBlockedShots),
      clubGoalkeeperSaves: scoreToString(match.isHome ? match.homeGoalkeeperSaves : match.awayGoalkeeperSaves),
      opponentGoalkeeperSaves: scoreToString(match.isHome ? match.awayGoalkeeperSaves : match.homeGoalkeeperSaves),
      clubTackles: scoreToString(match.isHome ? match.homeTackles : match.awayTackles),
      opponentTackles: scoreToString(match.isHome ? match.awayTackles : match.homeTackles),
      clubPasses: scoreToString(match.isHome ? match.homePasses : match.awayPasses),
      opponentPasses: scoreToString(match.isHome ? match.awayPasses : match.homePasses),
      clubCompletedPasses: scoreToString(match.isHome ? match.homeCompletedPasses : match.awayCompletedPasses),
      opponentCompletedPasses: scoreToString(match.isHome ? match.awayCompletedPasses : match.homeCompletedPasses),
      clubFouls: scoreToString(match.isHome ? match.homeFouls : match.awayFouls),
      opponentFouls: scoreToString(match.isHome ? match.awayFouls : match.homeFouls),
      clubYellowCards: scoreToString(match.isHome ? match.homeYellowCards : match.awayYellowCards),
      opponentYellowCards: scoreToString(match.isHome ? match.awayYellowCards : match.homeYellowCards),
      clubRedCards: scoreToString(match.isHome ? match.homeRedCards : match.awayRedCards),
      opponentRedCards: scoreToString(match.isHome ? match.awayRedCards : match.homeRedCards),
    })
    setFormError(null)
  }

  function buildPayload() {
    const homeScore = parseScore(form.homeScore)
    const awayScore = parseScore(form.awayScore)

    return {
      teamId: form.teamId,
      opponentName: form.opponentName.trim(),
      matchDate: form.matchDate,
      matchTime: form.matchTime,
      location: form.location.trim(),
      isHome: form.isHome,
      matchType: form.matchType,
      roundLabel: form.roundLabel.trim(),
      status: form.status,
      homeScore,
      awayScore,
      notes: form.notes.trim(),
    }
  }

  function validateForm() {
    if (!form.teamId) return 'Selecciona un equipo.'
    if (!form.opponentName.trim()) return 'Introduce el rival.'
    if (!form.matchDate) return 'Introduce la fecha del partido.'
    if (form.matchType === 'league' && !form.roundLabel.trim()) return 'Introduce la jornada de liga.'
    if (form.status === 'played' && (!form.homeScore.trim() || !form.awayScore.trim())) {
      return 'Introduce el resultado para marcar el partido como jugado.'
    }
    return null
  }

  function updatePlayerStat(athleteId: string, patch: Partial<PlayerStatFormState>) {
    setPlayerForm((current) =>
      current.map((stat) => {
        if (stat.athleteId !== athleteId) return stat
        const next = { ...stat, ...patch }

        if (patch.isCalledUp === false) {
          next.isStarter = false
        }

        if (patch.isStarter === true) {
          next.isCalledUp = true
        }

        if (
          patch.minutes ||
          patch.goals ||
          patch.goalMinutes ||
          patch.assists ||
          patch.foulsCommitted ||
          patch.foulsReceived ||
          patch.yellowCards ||
          patch.yellowCardMinutes ||
          patch.redCard === true ||
          patch.redCardMinute ||
          patch.shots ||
          patch.saves
        ) {
          next.isCalledUp = true
        }

        if (patch.position !== undefined && patch.position !== 'goalkeeper') {
          next.saves = ''
        }

        if (patch.yellowCards !== undefined && parseRequiredStat(patch.yellowCards) >= 2) {
          next.redCard = true
        }

        if (patch.goals !== undefined) {
          next.goalMinutes = clampMinuteList(next.goalMinutes, parseRequiredStat(next.goals))
        }

        if (patch.yellowCards !== undefined) {
          next.yellowCardMinutes = clampMinuteList(next.yellowCardMinutes, parseRequiredStat(next.yellowCards))
        }

        if (patch.redCard === false && parseRequiredStat(next.yellowCards) < 2) {
          next.redCardMinute = ''
        }

        return next
      }),
    )
  }

  function buildPlayerStatsPayload(): PlayerStatActionInput[] {
    return playerForm.map((stat) => ({
      athleteId: stat.athleteId,
      position: stat.position || null,
      isCalledUp: stat.isCalledUp,
      isStarter: stat.isCalledUp ? stat.isStarter : false,
      shirtNumber: stat.shirtNumber.trim() ? Number(stat.shirtNumber) : null,
      minutes: parseRequiredStat(stat.minutes),
      goals: parseRequiredStat(stat.goals),
      goalMinutes: normalizeMinuteList(stat.goalMinutes),
      assists: parseRequiredStat(stat.assists),
      foulsCommitted: parseRequiredStat(stat.foulsCommitted),
      foulsReceived: parseRequiredStat(stat.foulsReceived),
      yellowCards: parseRequiredStat(stat.yellowCards),
      yellowCardMinutes: normalizeMinuteList(stat.yellowCardMinutes),
      redCards: stat.redCard || parseRequiredStat(stat.yellowCards) >= 2 ? 1 : 0,
      redCardMinute: stat.redCard || parseRequiredStat(stat.yellowCards) >= 2
        ? stat.redCardMinute.trim()
          ? Number(stat.redCardMinute)
          : null
        : null,
      shots: parseRequiredStat(stat.shots),
      saves: stat.position === 'goalkeeper' ? parseRequiredStat(stat.saves) : 0,
      notes: stat.notes.trim(),
    }))
  }

  function validatePlayerStats() {
    const calledUp = playerForm.filter((stat) => stat.isCalledUp)
    const starters = playerForm.filter((stat) => stat.isStarter)
    const usedShirtNumbers = new Map<string, string>()
    const errors: string[] = []
    const numericFields: Array<keyof PlayerStatFormState> = [
      'shirtNumber',
      'minutes',
      'goals',
      'assists',
      'foulsCommitted',
      'foulsReceived',
      'yellowCards',
      'redCardMinute',
      'shots',
      'saves',
    ]

    for (const stat of playerForm) {
      for (const field of numericFields) {
        const value = stat[field]
        if (typeof value === 'string' && value.trim() && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
          errors.push(`Revisa los números de ${stat.athleteName}.`)
          break
        }
      }

      if (stat.yellowCards.trim() && Number(stat.yellowCards) > 2) {
        errors.push(`${stat.athleteName} no puede tener más de 2 amarillas.`)
      }

      if (stat.minutes.trim() && Number(stat.minutes) > 100) {
        errors.push(`${stat.athleteName} no puede tener más de 100 minutos.`)
      }

      if (stat.position !== 'goalkeeper' && stat.saves.trim() && Number(stat.saves) > 0) {
        errors.push(`Solo puedes asignar paradas a un portero. Revisa a ${stat.athleteName}.`)
      }

      const goalMinutes = parseMinuteList(stat.goalMinutes)
      const yellowCardMinutes = parseMinuteList(stat.yellowCardMinutes)
      const redCardMinute = stat.redCardMinute.trim() ? Number(stat.redCardMinute) : null

      if (
        [...goalMinutes, ...yellowCardMinutes, ...(redCardMinute === null ? [] : [redCardMinute])].some(
          (minute) => !Number.isInteger(minute) || minute < 1 || minute > 100,
        )
      ) {
        errors.push(`Los minutos de goles y tarjetas de ${stat.athleteName} deben estar entre 1 y 100.`)
      }

      if (goalMinutes.length !== parseRequiredStat(stat.goals)) {
        errors.push(`${stat.athleteName} debe tener un minuto por cada gol.`)
      }

      if (yellowCardMinutes.length !== parseRequiredStat(stat.yellowCards)) {
        errors.push(`${stat.athleteName} debe tener un minuto por cada amarilla.`)
      }

      if ((stat.redCard || parseRequiredStat(stat.yellowCards) >= 2) && redCardMinute === null) {
        errors.push(`${stat.athleteName} debe tener minuto de tarjeta roja.`)
      }

      if (stat.isCalledUp && stat.shirtNumber.trim()) {
        const previousPlayer = usedShirtNumbers.get(stat.shirtNumber.trim())

        if (previousPlayer) {
          errors.push(`${previousPlayer} y ${stat.athleteName} no pueden tener el mismo dorsal (${stat.shirtNumber.trim()}).`)
          continue
        }

        usedShirtNumbers.set(stat.shirtNumber.trim(), stat.athleteName)
      }
    }

    if (starters.some((stat) => !stat.isCalledUp)) {
      errors.push('Todos los titulares deben estar convocados.')
    }

    if (starters.length > calledUp.length) {
      errors.push('No puede haber más titulares que convocados.')
    }

    return errors
  }

  function getPlayerStatTotals() {
    return playerForm.reduce(
      (totals, stat) => {
        if (!stat.isCalledUp) return totals

        totals.goals += parseRequiredStat(stat.goals)
        totals.foulsCommitted += parseRequiredStat(stat.foulsCommitted)
        totals.foulsReceived += parseRequiredStat(stat.foulsReceived)
        totals.yellowCards += parseRequiredStat(stat.yellowCards)
        totals.redCards += stat.redCard || parseRequiredStat(stat.yellowCards) >= 2 ? 1 : 0
        totals.shots += parseRequiredStat(stat.shots)
        totals.saves += stat.position === 'goalkeeper' ? parseRequiredStat(stat.saves) : 0

        return totals
      },
      {
        goals: 0,
        foulsCommitted: 0,
        foulsReceived: 0,
        yellowCards: 0,
        redCards: 0,
        shots: 0,
        saves: 0,
      },
    )
  }

  function getPlayerStatConsistency() {
    const totals = getPlayerStatTotals()
    const comparisons = [
      {
        singularLabel: 'gol',
        pluralLabel: 'goles',
        teamLabel: CLUB.shortName,
        general: parseOptionalStat(resultForm.clubScore),
        players: totals.goals,
      },
      {
        singularLabel: 'falta',
        pluralLabel: 'faltas',
        teamLabel: CLUB.shortName,
        general: parseOptionalStat(resultForm.clubFouls),
        players: totals.foulsCommitted,
      },
      {
        singularLabel: 'falta recibida',
        pluralLabel: 'faltas recibidas',
        teamLabel: CLUB.shortName,
        general: parseOptionalStat(resultForm.opponentFouls),
        players: totals.foulsReceived,
      },
      {
        singularLabel: 'amarilla',
        pluralLabel: 'amarillas',
        teamLabel: CLUB.shortName,
        general: parseOptionalStat(resultForm.clubYellowCards),
        players: totals.yellowCards,
      },
      {
        singularLabel: 'roja',
        pluralLabel: 'rojas',
        teamLabel: CLUB.shortName,
        general: parseOptionalStat(resultForm.clubRedCards),
        players: totals.redCards,
      },
      {
        singularLabel: 'tiro',
        pluralLabel: 'tiros',
        teamLabel: CLUB.shortName,
        general: parseOptionalStat(resultForm.clubShots),
        players: totals.shots,
      },
      {
        singularLabel: 'parada',
        pluralLabel: 'paradas',
        teamLabel: CLUB.shortName,
        general: parseOptionalStat(resultForm.clubGoalkeeperSaves),
        players: totals.saves,
      },
    ]

    const errors: string[] = []
    const warnings: string[] = []

    for (const comparison of comparisons) {
      if (comparison.general === null) continue

      const difference = comparison.general - comparison.players

      if (difference < 0) {
        errors.push(
          `El total de ${comparison.pluralLabel} asignado a jugadores es ${comparison.players}, pero el total general de ${comparison.teamLabel} es ${comparison.general}.`,
        )
      } else if (difference > 0) {
        const label = difference === 1 ? comparison.singularLabel : comparison.pluralLabel
        warnings.push(
          `${difference === 1 ? 'Falta' : 'Faltan'} ${difference} ${label} de ${comparison.teamLabel} por asignar a jugadores.`,
        )
      }
    }

    return { errors, warnings }
  }

  function handleSubmit() {
    const error = validateForm()
    if (error) {
      setFormError(error)
      return
    }

    setFormError(null)
    startTransition(async () => {
      try {
        const payload = buildPayload()
        if (mode === 'create') {
          await calendarActions.createMatch(payload)
        } else if (editing) {
          await calendarActions.updateMatch({ ...payload, id: editing.id })
        }
        setSheetOpen(false)
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'No se ha podido guardar el partido.')
      }
    })
  }

  function handleResultSubmit(forceSave = false) {
    if (!resultMatch) return
    const hasClubScore = Boolean(resultForm.clubScore.trim())
    const hasOpponentScore = Boolean(resultForm.opponentScore.trim())

    if (hasClubScore !== hasOpponentScore) {
      setFormError('Introduce los goles de ambos equipos o deja ambos vacíos.')
      return
    }

    const values = [
      resultForm.clubScore,
      resultForm.opponentScore,
      resultForm.clubPossession,
      resultForm.opponentPossession,
      resultForm.clubOffsides,
      resultForm.opponentOffsides,
      resultForm.clubCorners,
      resultForm.opponentCorners,
      resultForm.clubTotalShots,
      resultForm.opponentTotalShots,
      resultForm.clubShots,
      resultForm.opponentShots,
      resultForm.clubShotsOnTarget,
      resultForm.opponentShotsOnTarget,
      resultForm.clubBlockedShots,
      resultForm.opponentBlockedShots,
      resultForm.clubGoalkeeperSaves,
      resultForm.opponentGoalkeeperSaves,
      resultForm.clubTackles,
      resultForm.opponentTackles,
      resultForm.clubPasses,
      resultForm.opponentPasses,
      resultForm.clubCompletedPasses,
      resultForm.opponentCompletedPasses,
      resultForm.clubFouls,
      resultForm.opponentFouls,
      resultForm.clubYellowCards,
      resultForm.opponentYellowCards,
      resultForm.clubRedCards,
      resultForm.opponentRedCards,
    ]

    if (values.some((value) => value.trim() && (!Number.isInteger(Number(value)) || Number(value) < 0))) {
      setFormError('Los datos de la ficha deben ser números enteros válidos.')
      return
    }

    const hasPossession = Boolean(resultForm.clubPossession.trim() || resultForm.opponentPossession.trim())
    if (hasPossession) {
      const possessionTotal = parseRequiredStat(resultForm.clubPossession) + parseRequiredStat(resultForm.opponentPossession)

      if (!resultForm.clubPossession.trim() || !resultForm.opponentPossession.trim() || possessionTotal !== 100) {
        setResultTab('summary')
        setFormError('La posesión de ambos equipos debe sumar exactamente 100.')
        return
      }
    }

    const playerStatsErrors = validatePlayerStats()
    const consistency = getPlayerStatConsistency()
    const blockingErrors = [...playerStatsErrors, ...consistency.errors]

    if (blockingErrors.length > 0) {
      setResultTab('players')
      setFormError(blockingErrors.join('\n'))
      return
    }

    if (!forceSave && consistency.warnings.length > 0) {
      setResultTab('players')
      setFormError(null)
      setStatWarnings(consistency.warnings)
      return
    }

    const clubScore = parseOptionalStat(resultForm.clubScore)
    const opponentScore = parseOptionalStat(resultForm.opponentScore)
    const clubPossession = parseOptionalStat(resultForm.clubPossession)
    const opponentPossession = parseOptionalStat(resultForm.opponentPossession)
    const clubOffsides = parseOptionalStat(resultForm.clubOffsides)
    const opponentOffsides = parseOptionalStat(resultForm.opponentOffsides)
    const clubCorners = parseOptionalStat(resultForm.clubCorners)
    const opponentCorners = parseOptionalStat(resultForm.opponentCorners)
    const clubTotalShots = getAutoTotalShots(resultForm, 'club')
    const opponentTotalShots = getAutoTotalShots(resultForm, 'opponent')
    const clubShots = parseOptionalStat(resultForm.clubShots)
    const opponentShots = parseOptionalStat(resultForm.opponentShots)
    const clubShotsOnTarget = parseOptionalStat(resultForm.clubShotsOnTarget)
    const opponentShotsOnTarget = parseOptionalStat(resultForm.opponentShotsOnTarget)
    const clubBlockedShots = parseOptionalStat(resultForm.clubBlockedShots)
    const opponentBlockedShots = parseOptionalStat(resultForm.opponentBlockedShots)
    const clubGoalkeeperSaves = parseOptionalStat(resultForm.clubGoalkeeperSaves)
    const opponentGoalkeeperSaves = parseOptionalStat(resultForm.opponentGoalkeeperSaves)
    const clubTackles = parseOptionalStat(resultForm.clubTackles)
    const opponentTackles = parseOptionalStat(resultForm.opponentTackles)
    const clubPasses = parseOptionalStat(resultForm.clubPasses)
    const opponentPasses = parseOptionalStat(resultForm.opponentPasses)
    const clubCompletedPasses = parseOptionalStat(resultForm.clubCompletedPasses)
    const opponentCompletedPasses = parseOptionalStat(resultForm.opponentCompletedPasses)
    const clubFouls = parseOptionalStat(resultForm.clubFouls)
    const opponentFouls = parseOptionalStat(resultForm.opponentFouls)
    const clubYellowCards = parseOptionalStat(resultForm.clubYellowCards)
    const opponentYellowCards = parseOptionalStat(resultForm.opponentYellowCards)
    const clubRedCards = parseOptionalStat(resultForm.clubRedCards)
    const opponentRedCards = parseOptionalStat(resultForm.opponentRedCards)
    const nextStatus =
      clubScore !== null && opponentScore !== null
        ? 'played'
        : resultMatch.status === 'played'
          ? 'scheduled'
          : resultMatch.status

    setFormError(null)
    setStatWarnings([])
    startTransition(async () => {
      try {
        await calendarActions.updateMatch({
          id: resultMatch.id,
          teamId: resultMatch.teamId,
          opponentName: resultMatch.opponentName,
          matchDate: resultMatch.matchDate,
          matchTime: resultMatch.matchTime,
          location: resultMatch.location,
          isHome: resultMatch.isHome,
          matchType: resultMatch.matchType,
          roundLabel: resultMatch.roundLabel,
          status: nextStatus,
          homeScore: resultMatch.isHome ? clubScore : opponentScore,
          awayScore: resultMatch.isHome ? opponentScore : clubScore,
          homePossession: resultMatch.isHome ? clubPossession : opponentPossession,
          awayPossession: resultMatch.isHome ? opponentPossession : clubPossession,
          homeOffsides: resultMatch.isHome ? clubOffsides : opponentOffsides,
          awayOffsides: resultMatch.isHome ? opponentOffsides : clubOffsides,
          homeCorners: resultMatch.isHome ? clubCorners : opponentCorners,
          awayCorners: resultMatch.isHome ? opponentCorners : clubCorners,
          homeTotalShots: resultMatch.isHome ? clubTotalShots : opponentTotalShots,
          awayTotalShots: resultMatch.isHome ? opponentTotalShots : clubTotalShots,
          homeShots: resultMatch.isHome ? clubShots : opponentShots,
          awayShots: resultMatch.isHome ? opponentShots : clubShots,
          homeShotsOnTarget: resultMatch.isHome ? clubShotsOnTarget : opponentShotsOnTarget,
          awayShotsOnTarget: resultMatch.isHome ? opponentShotsOnTarget : clubShotsOnTarget,
          homeBlockedShots: resultMatch.isHome ? clubBlockedShots : opponentBlockedShots,
          awayBlockedShots: resultMatch.isHome ? opponentBlockedShots : clubBlockedShots,
          homeGoalkeeperSaves: resultMatch.isHome ? clubGoalkeeperSaves : opponentGoalkeeperSaves,
          awayGoalkeeperSaves: resultMatch.isHome ? opponentGoalkeeperSaves : clubGoalkeeperSaves,
          homeTackles: resultMatch.isHome ? clubTackles : opponentTackles,
          awayTackles: resultMatch.isHome ? opponentTackles : clubTackles,
          homePasses: resultMatch.isHome ? clubPasses : opponentPasses,
          awayPasses: resultMatch.isHome ? opponentPasses : clubPasses,
          homeCompletedPasses: resultMatch.isHome ? clubCompletedPasses : opponentCompletedPasses,
          awayCompletedPasses: resultMatch.isHome ? opponentCompletedPasses : clubCompletedPasses,
          homeFouls: resultMatch.isHome ? clubFouls : opponentFouls,
          awayFouls: resultMatch.isHome ? opponentFouls : clubFouls,
          homeYellowCards: resultMatch.isHome ? clubYellowCards : opponentYellowCards,
          awayYellowCards: resultMatch.isHome ? opponentYellowCards : clubYellowCards,
          homeRedCards: resultMatch.isHome ? clubRedCards : opponentRedCards,
          awayRedCards: resultMatch.isHome ? opponentRedCards : clubRedCards,
          playerStats: buildPlayerStatsPayload(),
          notes: resultMatch.notes,
        })
        setResultMatch(null)
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'No se ha podido guardar el resultado.')
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await calendarActions.deleteMatch(id)
        setDeleteId(null)
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'No se ha podido eliminar el partido.')
      }
    })
  }

  const eventPlayer = eventPlayerId ? playerForm.find((player) => player.athleteId === eventPlayerId) ?? null : null
  const eventGoalCount = eventPlayer ? parseRequiredStat(eventPlayer.goals) : 0
  const eventYellowCount = eventPlayer ? parseRequiredStat(eventPlayer.yellowCards) : 0
  const eventHasRedCard = Boolean(eventPlayer && (eventPlayer.redCard || parseRequiredStat(eventPlayer.yellowCards) >= 2))
  const eventGoalMinutes = eventPlayer ? getMinuteFields(eventPlayer.goalMinutes, eventGoalCount) : []
  const eventYellowMinutes = eventPlayer ? getMinuteFields(eventPlayer.yellowCardMinutes, eventYellowCount) : []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {matches.length} {matches.length === 1 ? 'partido' : 'partidos'}
        </span>
        <Button size="sm" onClick={openCreate} disabled={selectableTeams.length === 0}>
          <Plus className="size-4" aria-hidden="true" />
          Nuevo partido
        </Button>
      </div>

      {selectableTeams.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
          {emptyTeamsMessage}
        </p>
      ) : null}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Búsqueda general"
            className="pl-9"
          />
        </div>
        {search || hasColumnFilters ? (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="size-3.5" />
            Limpiar
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-foreground/10 md:grid-cols-3 xl:grid-cols-8">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-week">Semana</Label>
          <select
            id="filter-week"
            value={filters.week}
            onChange={(event) => setFilter('week', event.target.value)}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Todas</option>
            {weekOptions.map((option) => {
              const [weekLabel, weekRangeLabel] = option.split('|')
              return (
                <option key={option} value={option}>
                  {weekLabel} · {weekRangeLabel}
                </option>
              )
            })}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-round">Jornada</Label>
          <Input
            id="filter-round"
            value={filters.round}
            onChange={(event) => setFilter('round', event.target.value)}
            placeholder="Jornada"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-date">Fecha</Label>
          <Input
            id="filter-date"
            value={filters.date}
            onChange={(event) => setFilter('date', event.target.value)}
            placeholder="dd/mm/aaaa"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-team">Equipo</Label>
          <select
            id="filter-team"
            value={filters.team}
            onChange={(event) => setFilter('team', event.target.value)}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Todos</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-opponent">Rival</Label>
          <Input
            id="filter-opponent"
            value={filters.opponent}
            onChange={(event) => setFilter('opponent', event.target.value)}
            placeholder="Rival"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-location">Lugar</Label>
          <Input
            id="filter-location"
            value={filters.location}
            onChange={(event) => setFilter('location', event.target.value)}
            placeholder="Campo"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-type">Competición</Label>
          <select
            id="filter-type"
            value={filters.type}
            onChange={(event) => setFilter('type', event.target.value)}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Todas</option>
            {Object.entries(MATCH_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-status">Estado</Label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(event) => setFilter('status', event.target.value)}
            className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {formError && !sheetOpen && !resultMatch ? (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {formError.includes('\n') ? (
            <ul className="space-y-1">
              {formError.split('\n').map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : (
            <p>{formError}</p>
          )}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="border-b border-border bg-blue-50 text-xs font-bold text-blue-950">
              <th className="px-4 py-2.5 text-center">Jornada</th>
              <th className="px-4 py-2.5 text-center">Fecha</th>
              <th className="px-4 py-2.5 text-center">Partido</th>
              <th className="px-4 py-2.5 text-center">Competición</th>
              <th className="px-4 py-2.5 text-center">Lugar</th>
              <th className="px-4 py-2.5 text-center">Estado</th>
              <th className="px-4 py-2.5 text-center">Resultado</th>
              <th className="px-4 py-2.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filteredMatches.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No hay partidos registrados todavía.
                </td>
              </tr>
            ) : (
              filteredMatches.map((match) => {
                const isDeleting = deleteId === match.id

                return (
                  <tr
                    key={match.id}
                    className={cn('transition-colors hover:bg-muted/30', isDeleting && 'bg-destructive/5')}
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {match.matchType === 'league' ? match.roundLabel : 'Amistoso'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{match.dateLabel}</div>
                      <div className="mt-0.5 flex items-center justify-center gap-1.5 font-semibold text-foreground">
                        <CalendarDays className="size-3.5" aria-hidden="true" />
                        {match.timeLabel}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold leading-tight text-foreground">
                        <div>{match.isHome ? CLUB.shortName : match.opponentName}</div>
                        <div className="text-xs font-black uppercase text-muted-foreground">vs</div>
                        <div>{match.isHome ? match.opponentName : CLUB.shortName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {MATCH_TYPE_LABELS[match.matchType]}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {match.location || 'Sin lugar'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_STYLES[match.status])}>
                        {STATUS_LABELS[match.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black text-foreground">
                      {getScoreLabel(match)}
                    </td>
                    <td className="px-4 py-3">
                      {isDeleting ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                          <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleDelete(match.id)}>
                            Sí, eliminar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openResult(match)}>
                            <ClipboardList className="size-3.5" aria-hidden="true" />
                            Ficha
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(match)}>
                            <Pencil className="size-3.5" aria-hidden="true" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setSheetOpen(false)
                              setDeleteId(match.id)
                            }}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <AdminFormDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={mode === 'create' ? 'Nuevo partido' : 'Editar partido'}
        description={mode === 'create' ? 'Programa un partido para uno de los equipos del club.' : 'Actualiza la fecha, estado o datos generales del partido.'}
        maxWidth="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : mode === 'create' ? <Plus className="size-4" /> : <Pencil className="size-4" />}
              {mode === 'create' ? 'Crear partido' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-team">Equipo</Label>
            <select
              id="match-team"
              value={form.teamId}
              onChange={(event) => setField('teamId', event.target.value)}
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">Selecciona equipo</option>
              {selectableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-opponent">Rival</Label>
            <Input
              id="match-opponent"
              value={form.opponentName}
              onChange={(event) => setField('opponentName', event.target.value)}
              placeholder="Ej. CD Rival"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-date">Fecha</Label>
            <Input
              id="match-date"
              type="date"
              value={form.matchDate}
              onChange={(event) => setField('matchDate', event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-time">Hora</Label>
            <Input
              id="match-time"
              type="time"
              value={form.matchTime}
              onChange={(event) => setField('matchTime', event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-location">Lugar</Label>
            <Input
              id="match-location"
              value={form.location}
              onChange={(event) => setField('location', event.target.value)}
              placeholder="Campo municipal, pabellón..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-type">Competición</Label>
            <select
              id="match-type"
              value={form.matchType}
              onChange={(event) => {
                const value = event.target.value as AdminMatchType
                setForm((current) => ({
                  ...current,
                  matchType: value,
                  roundLabel: value === 'friendly' ? '' : current.roundLabel,
                }))
              }}
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {Object.entries(MATCH_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-round">Jornada</Label>
            <Input
              id="match-round"
              value={form.roundLabel}
              onChange={(event) => setField('roundLabel', event.target.value)}
              placeholder="Ej. Jornada 4"
              disabled={form.matchType !== 'league'}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-status">Estado</Label>
            <select
              id="match-status"
              value={form.status}
              onChange={(event) => setField('status', event.target.value as AdminMatchStatus)}
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2">
            <input
              id="match-home"
              type="checkbox"
              checked={form.isHome}
              onChange={(event) => setField('isHome', event.target.checked)}
              className="size-4 rounded border-border accent-primary"
            />
            <Label htmlFor="match-home">El equipo del club juega como local</Label>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          <Label htmlFor="match-notes">Notas internas</Label>
          <textarea
            id="match-notes"
            value={form.notes}
            onChange={(event) => setField('notes', event.target.value)}
            placeholder="Observaciones opcionales..."
            rows={4}
            className="w-full resize-none rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        {formError ? (
          <div className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {formError.includes('\n') ? (
              <ul className="space-y-1">
                {formError.split('\n').map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : (
              <p>{formError}</p>
            )}
          </div>
        ) : null}
      </AdminFormDialog>

      <AdminFormDialog
        open={Boolean(resultMatch)}
        onOpenChange={(open) => {
          if (!open) {
            setResultMatch(null)
            setStatWarnings([])
          }
        }}
        title="Ficha del partido"
        description={resultMatch ? `${CLUB.shortName} vs ${resultMatch.opponentName}` : 'Consulta y edita los datos básicos del partido.'}
        maxWidth="2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setResultMatch(null)}>
              Cancelar
            </Button>
            <Button onClick={() => handleResultSubmit()} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CalendarDays className="size-4" />}
              Guardar ficha
            </Button>
          </>
        }
      >
        <div className="mb-4 inline-flex rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setResultTab('summary')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-bold transition-colors',
              resultTab === 'summary' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Resumen
          </button>
          <button
            type="button"
            onClick={() => setResultTab('players')}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-bold transition-colors',
              resultTab === 'players' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Jugadores
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-white">
          {resultMatch ? (
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border px-4 py-4">
              <div className="text-right">
                <p className="text-sm font-black text-foreground">{CLUB.shortName}</p>
                <p className="text-xs text-muted-foreground">
                  {resultMatch.isHome ? 'Local' : 'Visitante'}
                </p>
              </div>
              <div className="rounded-lg bg-muted px-4 py-2 text-2xl font-black text-foreground">
                {resultForm.clubScore || '-'} - {resultForm.opponentScore || '-'}
              </div>
              <div>
                <p className="text-sm font-black text-foreground">{resultMatch.opponentName}</p>
                <p className="text-xs text-muted-foreground">
                  {resultMatch.isHome ? 'Visitante' : 'Local'}
                </p>
              </div>
            </div>
          ) : null}

          {resultTab === 'summary' ? [
            {
              title: 'Estadísticas generales',
              rows: [
                { label: 'Goles', clubKey: 'clubScore', opponentKey: 'opponentScore' },
                { label: 'Posesión', clubKey: 'clubPossession', opponentKey: 'opponentPossession' },
                { label: 'Fueras de juego', clubKey: 'clubOffsides', opponentKey: 'opponentOffsides' },
                { label: 'Saques de esquina', clubKey: 'clubCorners', opponentKey: 'opponentCorners' },
              ],
            },
            {
              title: 'Ataque',
              rows: [
                { label: 'Disparos totales', clubKey: 'clubTotalShots', opponentKey: 'opponentTotalShots' },
                { label: 'Tiros', clubKey: 'clubShots', opponentKey: 'opponentShots' },
                { label: 'Tiros a puerta', clubKey: 'clubShotsOnTarget', opponentKey: 'opponentShotsOnTarget' },
                { label: 'Disparos bloqueados', clubKey: 'clubBlockedShots', opponentKey: 'opponentBlockedShots' },
              ],
            },
            {
              title: 'Defensa',
              rows: [
                { label: 'Paradas del portero', clubKey: 'clubGoalkeeperSaves', opponentKey: 'opponentGoalkeeperSaves' },
                { label: 'Recuperaciones', clubKey: 'clubTackles', opponentKey: 'opponentTackles' },
              ],
            },
            {
              title: 'Disciplina',
              rows: [
                { label: 'Faltas', clubKey: 'clubFouls', opponentKey: 'opponentFouls' },
                { label: 'Tarjetas amarillas', clubKey: 'clubYellowCards', opponentKey: 'opponentYellowCards' },
                { label: 'Tarjetas rojas', clubKey: 'clubRedCards', opponentKey: 'opponentRedCards' },
              ],
            },
          ].map((section) => (
            <section key={section.title} className="border-b border-border last:border-b-0 px-4 py-3">
              <h3 className="mb-3 text-center text-xs font-black uppercase text-foreground">
                {section.title}
              </h3>
              <div className="space-y-3">
                {section.rows.map((row, rowIndex) => {
                  const clubKey = row.clubKey as keyof ResultFormState
                  const opponentKey = row.opponentKey as keyof ResultFormState
                  const isTotalShots = clubKey === 'clubTotalShots'
                  const clubValue = isTotalShots ? String(getAutoTotalShots(resultForm, 'club')) : resultForm[clubKey]
                  const opponentValue = isTotalShots ? String(getAutoTotalShots(resultForm, 'opponent')) : resultForm[opponentKey]
                  const widths = getStatWidths(clubValue, opponentValue)

                  return (
                    <div key={row.label} className={cn(rowIndex > 0 && 'border-t border-border pt-3')}>
                      <div className="grid grid-cols-[120px_minmax(220px,1fr)_120px] items-center gap-3">
                        <Input
                          id={`sheet-${row.clubKey}`}
                          type="number"
                          min="0"
                          value={clubValue}
                          disabled={isTotalShots}
                          onChange={(event) =>
                            setResultForm((current) => ({ ...current, [row.clubKey]: event.target.value }))
                          }
                          className={cn(
                            'h-7 rounded-full bg-emerald-100 text-center text-xs font-black text-emerald-800',
                            isTotalShots && 'opacity-80',
                          )}
                          autoFocus={section.title === 'Estadísticas generales' && rowIndex === 0}
                          aria-label={`${row.label} ${CLUB.shortName}`}
                        />
                        <Label
                          htmlFor={`sheet-${row.clubKey}`}
                          className="justify-self-center text-center text-xs font-semibold text-muted-foreground"
                        >
                          {row.label}
                        </Label>
                        <Input
                          id={`sheet-${row.opponentKey}`}
                          type="number"
                          min="0"
                          value={opponentValue}
                          disabled={isTotalShots}
                          onChange={(event) =>
                            setResultForm((current) => ({ ...current, [row.opponentKey]: event.target.value }))
                          }
                          className={cn(
                            'h-7 rounded-full bg-sky-100 text-center text-xs font-black text-sky-800',
                            isTotalShots && 'opacity-80',
                          )}
                          aria-label={`${row.label} rival`}
                        />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="ml-auto h-full rounded-full bg-emerald-400"
                            style={{ width: `${widths.left}%` }}
                          />
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-sky-400"
                            style={{ width: `${widths.right}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )) : (
            <div className="overflow-x-auto">
              {playerForm.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm font-semibold text-muted-foreground">
                  Este equipo no tiene jugadores asignados todavía.
                </div>
              ) : (
                <table className="w-full table-fixed text-left text-[11px]">
                  <colgroup>
                    <col className="w-[13%]" />
                    <col className="w-[4%]" />
                    <col className="w-[4%]" />
                    <col className="w-[8%]" />
                    <col className="w-[5%]" />
                    <col className="w-[5%]" />
                    <col className="w-[6%]" />
                    <col className="w-[7%]" />
                    <col className="w-[6%]" />
                    <col className="w-[7%]" />
                    <col className="w-[6%]" />
                    <col className="w-[4%]" />
                    <col className="w-[5%]" />
                    <col className="w-[6%]" />
                    <col className="w-[7%]" />
                    <col className="w-[7%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-border bg-blue-50 font-bold text-blue-950">
                      <th className="px-2 py-2">Jugador</th>
                      <th className="px-1 py-2 text-center">Conv.</th>
                      <th className="px-1 py-2 text-center">Tit.</th>
                      <th className="px-1 py-2 text-center">Pos.</th>
                      <th className="px-1 py-2 text-center">Dorsal</th>
                      <th className="px-1 py-2 text-center">Min</th>
                      <th className="px-1 py-2 text-center">Goles</th>
                      <th className="px-1 py-2 text-center">Asist.</th>
                      <th className="px-1 py-2 text-center">Faltas</th>
                      <th className="px-1 py-2 text-center">F. Rec.</th>
                      <th className="px-1 py-2 text-center">Amar.</th>
                      <th className="px-1 py-2 text-center">Roja</th>
                      <th className="px-1 py-2 text-center">Tiros</th>
                      <th className="px-1 py-2 text-center">Paradas</th>
                      <th className="px-1 py-2 text-center">Eventos</th>
                      <th className="px-2 py-2">Obs.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {playerForm.map((player) => {
                      const disabled = !player.isCalledUp
                      const inputClass = 'h-8 w-full min-w-0 rounded-md border border-input bg-white px-1 text-center text-[11px] font-semibold text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:bg-muted disabled:text-muted-foreground'
                      const selectClass = 'h-8 w-full min-w-0 rounded-md border border-input bg-white px-1 text-[11px] font-semibold text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:bg-muted disabled:text-muted-foreground'
                      const isGoalkeeper = player.position === 'goalkeeper'

                      return (
                        <tr key={player.athleteId} className={cn(disabled ? 'bg-muted/20' : 'bg-white')}>
                          <td className="px-2 py-2">
                            <div className="truncate font-black text-foreground" title={player.athleteName}>
                              {player.athleteName}
                            </div>
                          </td>
                          <td className="px-1 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={player.isCalledUp}
                              onChange={(event) => updatePlayerStat(player.athleteId, { isCalledUp: event.target.checked })}
                              className="size-4 rounded border-border accent-primary"
                              aria-label={`Convocar a ${player.athleteName}`}
                            />
                          </td>
                          <td className="px-1 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={player.isStarter}
                              onChange={(event) => updatePlayerStat(player.athleteId, { isStarter: event.target.checked })}
                              className="size-4 rounded border-border accent-primary"
                              aria-label={`${player.athleteName} titular`}
                            />
                          </td>
                          <td className="px-1 py-2">
                            <select
                              value={player.position}
                              disabled={disabled}
                              onChange={(event) =>
                                updatePlayerStat(player.athleteId, {
                                  position: event.target.value as PlayerStatFormState['position'],
                                })
                              }
                              className={selectClass}
                              aria-label={`Posicion ${player.athleteName}`}
                            >
                              {POSITION_OPTIONS.map((position) => (
                                <option key={position.value} value={position.value}>
                                  {position.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          {[
                            ['shirtNumber', 'Dorsal'],
                            ['minutes', 'Minutos'],
                          ].map(([field, label]) => (
                            <td key={field} className="px-1 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                max={field === 'minutes' ? '100' : field === 'yellowCards' ? '2' : undefined}
                                step="1"
                                value={player[field as keyof PlayerStatFormState] as string}
                                disabled={disabled}
                                onChange={(event) =>
                                  updatePlayerStat(player.athleteId, {
                                    [field]: event.target.value,
                                  } as Partial<PlayerStatFormState>)
                                }
                                className={inputClass}
                                aria-label={`${label} ${player.athleteName}`}
                              />
                            </td>
                          ))}
                          <td className="px-1 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={player.goals}
                              disabled={disabled}
                              onChange={(event) => updatePlayerStat(player.athleteId, { goals: event.target.value })}
                              className={inputClass}
                              aria-label={`Goles ${player.athleteName}`}
                            />
                          </td>
                          {[
                            ['assists', 'Asistencias'],
                            ['foulsCommitted', 'Faltas cometidas'],
                            ['foulsReceived', 'Faltas recibidas'],
                          ].map(([field, label]) => (
                            <td key={field} className="px-1 py-2 text-center">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={player[field as keyof PlayerStatFormState] as string}
                                disabled={disabled}
                                onChange={(event) =>
                                  updatePlayerStat(player.athleteId, {
                                    [field]: event.target.value,
                                  } as Partial<PlayerStatFormState>)
                                }
                                className={inputClass}
                                aria-label={`${label} ${player.athleteName}`}
                              />
                            </td>
                          ))}
                          <td className="px-1 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              max="2"
                              step="1"
                              value={player.yellowCards}
                              disabled={disabled}
                              onChange={(event) => updatePlayerStat(player.athleteId, { yellowCards: event.target.value })}
                              className={inputClass}
                              aria-label={`Tarjetas amarillas ${player.athleteName}`}
                            />
                          </td>
                          <td className="px-1 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={player.redCard}
                              disabled={disabled}
                              onChange={(event) => updatePlayerStat(player.athleteId, { redCard: event.target.checked })}
                              className="size-4 rounded border-border accent-primary disabled:opacity-50"
                              aria-label={`Tarjeta roja ${player.athleteName}`}
                            />
                          </td>
                          <td className="px-1 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={player.shots}
                              disabled={disabled}
                              onChange={(event) => updatePlayerStat(player.athleteId, { shots: event.target.value })}
                              className={inputClass}
                              aria-label={`Tiros ${player.athleteName}`}
                            />
                          </td>
                          <td className="px-1 py-2 text-center">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={player.saves}
                              disabled={disabled || !isGoalkeeper}
                              onChange={(event) => updatePlayerStat(player.athleteId, { saves: event.target.value })}
                              className={inputClass}
                              aria-label={`Paradas ${player.athleteName}`}
                            />
                          </td>
                          <td className="px-1 py-2 text-center">
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={disabled}
                              onClick={() => setEventPlayerId(player.athleteId)}
                              className="h-8 w-full gap-1 px-1 text-[10px]"
                              aria-label={`Eventos de ${player.athleteName}`}
                            >
                              <ClipboardList className="size-3" aria-hidden="true" />
                              <span>
                                {parseRequiredStat(player.goals) +
                                  parseRequiredStat(player.yellowCards) +
                                  (player.redCard || parseRequiredStat(player.yellowCards) >= 2 ? 1 : 0)}
                              </span>
                            </Button>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={player.notes}
                              disabled={disabled}
                              onChange={(event) => updatePlayerStat(player.athleteId, { notes: event.target.value })}
                              className="h-8 w-full min-w-0 rounded-md border border-input bg-white px-2 text-[11px] font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:bg-muted disabled:text-muted-foreground"
                              aria-label={`Observaciones ${player.athleteName}`}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {formError ? (
          <div className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {formError.includes('\n') ? (
              <ul className="space-y-1">
                {formError.split('\n').map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : (
              <p>{formError}</p>
            )}
          </div>
        ) : null}
      </AdminFormDialog>

      <AdminFormDialog
        open={Boolean(eventPlayer)}
        onOpenChange={(open) => {
          if (!open) setEventPlayerId(null)
        }}
        title={eventPlayer ? `Eventos de ${eventPlayer.athleteName}` : 'Eventos'}
        description={resultMatch ? `${CLUB.shortName} vs ${resultMatch.opponentName}` : undefined}
        maxWidth="md"
        footer={
          <Button onClick={() => setEventPlayerId(null)}>
            Cerrar
          </Button>
        }
      >
        {eventPlayer ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-foreground">Goles</p>
                  <p className="text-xs font-semibold text-muted-foreground">{eventGoalCount}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {eventGoalCount > 0 ? (
                    eventGoalMinutes.map((minute, index) => (
                      <Input
                        key={`goal-${index}`}
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={minute}
                        onChange={(event) =>
                          updatePlayerStat(eventPlayer.athleteId, {
                            goalMinutes: setMinuteField(eventPlayer.goalMinutes, eventGoalCount, index, event.target.value),
                          })
                        }
                        className="h-9 w-16 text-center font-bold"
                        aria-label={`Minuto gol ${index + 1} ${eventPlayer.athleteName}`}
                        placeholder={`${index + 1}`}
                      />
                    ))
                  ) : (
                    <span className="col-span-3 text-sm font-semibold text-muted-foreground sm:col-span-5">Sin goles</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-foreground">Amarillas</p>
                  <p className="text-xs font-semibold text-muted-foreground">{eventYellowCount}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {eventYellowCount > 0 ? (
                    eventYellowMinutes.map((minute, index) => (
                      <Input
                        key={`yellow-${index}`}
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        value={minute}
                        onChange={(event) =>
                          updatePlayerStat(eventPlayer.athleteId, {
                            yellowCardMinutes: setMinuteField(eventPlayer.yellowCardMinutes, eventYellowCount, index, event.target.value),
                          })
                        }
                        className="h-9 w-16 text-center font-bold"
                        aria-label={`Minuto amarilla ${index + 1} ${eventPlayer.athleteName}`}
                        placeholder={`${index + 1}`}
                      />
                    ))
                  ) : (
                    <span className="col-span-3 text-sm font-semibold text-muted-foreground sm:col-span-5">Sin amarillas</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-foreground">Roja</p>
                  <p className="text-xs font-semibold text-muted-foreground">{eventHasRedCard ? 'Sí' : 'No'}</p>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={eventPlayer.redCardMinute}
                  disabled={!eventHasRedCard}
                  onChange={(event) => updatePlayerStat(eventPlayer.athleteId, { redCardMinute: event.target.value })}
                  className="h-9 w-20 text-center font-bold"
                  aria-label={`Minuto roja ${eventPlayer.athleteName}`}
                  placeholder="Min."
                />
              </div>
            </div>
          </div>
        ) : null}
      </AdminFormDialog>

      <AdminFormDialog
        open={statWarnings.length > 0}
        onOpenChange={(open) => {
          if (!open) setStatWarnings([])
        }}
        title="Estadísticas incompletas"
        description="Las estadísticas generales tienen más datos que los asignados a jugadores."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setStatWarnings([])} disabled={isPending}>
              Revisar jugadores
            </Button>
            <Button onClick={() => handleResultSubmit(true)} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CalendarDays className="size-4" />}
              Guardar de todas formas
            </Button>
          </>
        }
      >
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">
                No has puesto todas las estadísticas de los jugadores.
              </p>
              <p className="mt-1 text-sm font-medium text-amber-900">
                Puedes revisarlas ahora o guardar la ficha igualmente.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {statWarnings.map((warning) => (
              <li key={warning} className="rounded-md bg-white/80 px-3 py-2 text-sm font-semibold text-amber-950 ring-1 ring-amber-200">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      </AdminFormDialog>
    </div>
  )
}
