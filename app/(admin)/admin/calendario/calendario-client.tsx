'use client'

import { useMemo, useState, useTransition } from 'react'
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Loader2, Palette, Pencil, Pipette, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react'
import { AdminErrorDialog } from '@/components/admin-error-dialog'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CLUB } from '@/lib/club'
import type { AdminMatchPlayerStat, AdminMatchRow, AdminMatchStatus, AdminMatchType, AdminTeamColorMap, AdminTeamRow, AdminTrainingSessionRow, TrainingLocation } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import {
  createMatchAction as adminCreateMatchAction,
  createTrainingAction as adminCreateTrainingAction,
  deleteMatchAction as adminDeleteMatchAction,
  deleteTrainingAction as adminDeleteTrainingAction,
  resetAllTeamColorsAction as adminResetAllTeamColorsAction,
  resetTeamColorAction as adminResetTeamColorAction,
  updateTeamColorAction as adminUpdateTeamColorAction,
  updateMatchAction as adminUpdateMatchAction,
  updateTrainingAction as adminUpdateTrainingAction,
} from './actions'

type Props = {
  matches: AdminMatchRow[]
  teams: AdminTeamRow[]
  trainings?: AdminTrainingSessionRow[]
  actions?: CalendarActions
  emptyTeamsMessage?: string
  showCoordinatorSections?: boolean
  teamColors?: AdminTeamColorMap
}

type SheetMode = 'create' | 'edit'
type CoordinatorCalendarTab = 'horario' | 'entrenamientos' | 'partidos'

type MatchFormState = {
  teamId: string
  opponentName: string
  matchDate: string
  matchTime: string
  durationHours: string
  durationMinutes: string
  location: TrainingLocation
  isHome: boolean
  matchType: AdminMatchType
  roundLabel: string
  status: AdminMatchStatus
  homeScore: string
  awayScore: string
  notes: string
}

type TrainingFormState = {
  teamId: string
  trainingDate: string
  startTime: string
  durationHours: string
  durationMinutes: string
  location: TrainingLocation
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

type TrainingFilters = {
  week: string
  date: string
  team: string
  location: string
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
  durationHours: number
  durationMinutes: number
  location: TrainingLocation
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

type TrainingActionInput = {
  teamId: string
  trainingDate: string
  startTime: string
  durationHours: number
  durationMinutes: number
  location: TrainingLocation
  notes: string
}

type CalendarActions = {
  createMatch: (input: MatchActionInput) => Promise<void>
  updateMatch: (input: MatchActionInput & { id: string }) => Promise<void>
  deleteMatch: (id: string) => Promise<void>
  createTraining?: (input: TrainingActionInput) => Promise<void>
  updateTraining?: (input: TrainingActionInput & { id: string }) => Promise<void>
  deleteTraining?: (id: string) => Promise<void>
}

const TEAM_COLOR_ACTIONS = {
  update: adminUpdateTeamColorAction,
  reset: adminResetTeamColorAction,
  resetAll: adminResetAllTeamColorsAction,
}

type ScheduleSlot = {
  date: string
  time: string
}

type ScheduleEvent = {
  id: string
  kind: 'match' | 'training'
  title: string
  subtitle: string
  teamName: string
  categoryName: string
  date: string
  startTime: string
  startMinute: number
  durationMinutes: number
  location: TrainingLocation
  team?: AdminTeamRow
  match?: AdminMatchRow
  training?: AdminTrainingSessionRow
}

type PositionedScheduleEvent = ScheduleEvent & {
  lane: number
  laneCount: number
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

const FIELD_LOCATIONS: TrainingLocation[] = ['Campo 1', 'Campo 2', 'Campo completo', 'Anexo']
const TRAINING_LOCATIONS = FIELD_LOCATIONS
const SCHEDULE_START_HOUR = 8
const SCHEDULE_END_HOUR = 22
const SCHEDULE_STEP_MINUTES = 15
const SCHEDULE_ROW_HEIGHT = 24
const FULL_FIELD_CATEGORIES = ['infantil', 'cadete', 'juvenil', 'senior']
const SCHEDULE_CATEGORY_HUES = [211, 156, 276, 18, 188, 332, 43, 246, 126, 6, 225, 168]
const STANDARD_TEAM_COLORS = ['#000000', '#ffffff', '#4d86f7', '#ea4335', '#f4b400', '#34a853', '#ff6d01', '#46bdc6']
const TEAM_COLOR_PALETTE = [
  '#000000', '#444444', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
  '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
  '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130',
]

const POSITION_OPTIONS: Array<{ value: PlayerStatFormState['position']; label: string }> = [
  { value: '', label: 'Sin posicion' },
  { value: 'goalkeeper', label: 'Portero' },
  { value: 'defender', label: 'Defensa' },
  { value: 'midfielder', label: 'Medio' },
  { value: 'forward', label: 'Delantero' },
]

function createEmptyForm(defaultTeamId = '', defaultLocation: TrainingLocation = 'Campo 1'): MatchFormState {
  return {
    teamId: defaultTeamId,
    opponentName: '',
    matchDate: '',
    matchTime: '',
    durationHours: '2',
    durationMinutes: '0',
    location: defaultLocation,
    isHome: true,
    matchType: 'league',
    roundLabel: '',
    status: 'scheduled',
    homeScore: '',
    awayScore: '',
    notes: '',
  }
}

function createEmptyTrainingForm(defaultTeamId = ''): TrainingFormState {
  return {
    teamId: defaultTeamId,
    trainingDate: '',
    startTime: '',
    durationHours: '1',
    durationMinutes: '30',
    location: 'Campo 1',
    notes: '',
  }
}

function getTeamDefaultMatchLocation(team?: AdminTeamRow): TrainingLocation {
  const category = team?.categoria.toLowerCase() ?? ''
  return FULL_FIELD_CATEGORIES.some((name) => category.includes(name)) ? 'Campo completo' : 'Campo 1'
}

function isValidFieldLocation(value: string): value is TrainingLocation {
  return FIELD_LOCATIONS.includes(value as TrainingLocation)
}

function normalizeFieldLocation(value: string): TrainingLocation {
  return isValidFieldLocation(value) ? value : 'Campo 1'
}

function hashText(value: string) {
  return Array.from(value).reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0)
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100
  const l = lightness / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] =
    hue < 60 ? [c, x, 0] :
    hue < 120 ? [x, c, 0] :
    hue < 180 ? [0, c, x] :
    hue < 240 ? [0, x, c] :
    hue < 300 ? [x, 0, c] :
    [c, 0, x]

  return `#${[r, g, b].map((value) => Math.round((value + m) * 255).toString(16).padStart(2, '0')).join('')}`
}

function normalizeHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null
}

function getDefaultTeamColor(team: Pick<AdminTeamRow, 'id' | 'nombre' | 'categoria'>) {
  const categoryKey = team.categoria.toLowerCase().trim() || 'sin categoria'
  const teamKey = team.nombre.toLowerCase().trim() || team.id
  const categoryHash = Math.abs(hashText(categoryKey))
  const teamHash = Math.abs(hashText(teamKey))
  const baseHue = SCHEDULE_CATEGORY_HUES[categoryHash % SCHEDULE_CATEGORY_HUES.length]
  const toneOffset = ((teamHash % 7) - 3) * 7
  const hue = (baseHue + toneOffset + 360) % 360
  const lightness = 38 + (teamHash % 3) * 5

  return hslToHex(hue, 72, lightness)
}

function getTeamColor(team: Pick<AdminTeamRow, 'id' | 'nombre' | 'categoria'>, colors: AdminTeamColorMap) {
  return normalizeHexColor(colors[team.id] ?? '') ?? getDefaultTeamColor(team)
}

function getReadableTextColor(backgroundColor: string) {
  const color = backgroundColor.replace('#', '')
  const red = parseInt(color.slice(0, 2), 16)
  const green = parseInt(color.slice(2, 4), 16)
  const blue = parseInt(color.slice(4, 6), 16)
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000

  return luminance > 170 ? '#0f172a' : '#ffffff'
}

function hexToRgb(value: string) {
  const color = normalizeHexColor(value) ?? '#000000'
  return {
    red: parseInt(color.slice(1, 3), 16),
    green: parseInt(color.slice(3, 5), 16),
    blue: parseInt(color.slice(5, 7), 16),
  }
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) => Math.min(255, Math.max(0, value)).toString(16).padStart(2, '0'))
    .join('')}`
}

function getScheduleEventColor(event: ScheduleEvent, colors: AdminTeamColorMap) {
  const teamColor = event.team ? getTeamColor(event.team, colors) : '#2563eb'
  const textColor = getReadableTextColor(teamColor)

  return {
    backgroundColor: teamColor,
    borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.22)',
    boxShadow: `0 8px 18px ${teamColor}33`,
    color: textColor,
  }
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekStart(date: Date) {
  const weekStart = new Date(date)
  const day = weekStart.getDay() || 7
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - day + 1)
  return weekStart
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const start = timeToMinutes(time)
  const total = start + minutesToAdd
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function formatShortDay(date: Date) {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long' }).format(date)
}

function formatDayNumber(date: Date) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(date)
}

function formatWeekTitle(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6)
  const formatter = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`
}

function rangesOverlap(left: ScheduleEvent, right: ScheduleEvent) {
  return left.startMinute < right.startMinute + right.durationMinutes && right.startMinute < left.startMinute + left.durationMinutes
}

function positionDayEvents(events: ScheduleEvent[]): PositionedScheduleEvent[] {
  const sorted = [...events].sort((a, b) => a.startMinute - b.startMinute || b.durationMinutes - a.durationMinutes)
  const positioned: PositionedScheduleEvent[] = []
  const activeCluster: ScheduleEvent[] = []
  let clusterEnd = 0

  function flushCluster() {
    if (activeCluster.length === 0) return
    const lanes: ScheduleEvent[][] = []

    for (const event of activeCluster) {
      const laneIndex = lanes.findIndex((lane) => !lane.some((placed) => rangesOverlap(placed, event)))
      const targetLane = laneIndex === -1 ? lanes.length : laneIndex
      lanes[targetLane] = [...(lanes[targetLane] ?? []), event]
    }

    for (const lane of lanes) {
      for (const event of lane) {
        positioned.push({
          ...event,
          lane: lanes.indexOf(lane),
          laneCount: lanes.length,
        })
      }
    }

    activeCluster.length = 0
    clusterEnd = 0
  }

  for (const event of sorted) {
    if (activeCluster.length > 0 && event.startMinute >= clusterEnd) {
      flushCluster()
    }

    activeCluster.push(event)
    clusterEnd = Math.max(clusterEnd, event.startMinute + event.durationMinutes)
  }

  flushCluster()
  return positioned
}

function trainingToForm(training: AdminTrainingSessionRow): TrainingFormState {
  return {
    teamId: training.teamId,
    trainingDate: training.trainingDate,
    startTime: training.startTime.slice(0, 5),
    durationHours: String(Math.floor(training.durationMinutes / 60)),
    durationMinutes: String(training.durationMinutes % 60),
    location: training.location,
    notes: training.notes,
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
  trainings = [],
  actions,
  emptyTeamsMessage = 'Crea al menos un equipo antes de programar partidos.',
  showCoordinatorSections = false,
  teamColors = {},
}: Props) {
  const [activeCoordinatorTab, setActiveCoordinatorTab] = useState<CoordinatorCalendarTab>('horario')
  const [scheduleWeekStart, setScheduleWeekStart] = useState(() => getWeekStart(new Date()))
  const [scheduleSlot, setScheduleSlot] = useState<ScheduleSlot | null>(null)
  const [teamColorMap, setTeamColorMap] = useState<AdminTeamColorMap>(teamColors)
  const [teamColorsOpen, setTeamColorsOpen] = useState(false)
  const [editingTeamColorId, setEditingTeamColorId] = useState<string | null>(null)
  const [selectedTeamColor, setSelectedTeamColor] = useState('')
  const [colorActionError, setColorActionError] = useState<string | null>(null)
  const [trainingSearch, setTrainingSearch] = useState('')
  const [trainingFilters, setTrainingFilters] = useState<TrainingFilters>({
    week: '',
    date: '',
    team: '',
    location: '',
  })
  const [trainingSheetOpen, setTrainingSheetOpen] = useState(false)
  const [trainingMode, setTrainingMode] = useState<SheetMode>('create')
  const [editingTraining, setEditingTraining] = useState<AdminTrainingSessionRow | null>(null)
  const [deleteTrainingId, setDeleteTrainingId] = useState<string | null>(null)
  const [trainingForm, setTrainingForm] = useState<TrainingFormState>(() => createEmptyTrainingForm(teams[0]?.id ?? ''))
  const [trainingError, setTrainingError] = useState<string | null>(null)
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
  const [form, setForm] = useState<MatchFormState>(() => createEmptyForm(teams[0]?.id ?? '', getTeamDefaultMatchLocation(teams[0])))
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const calendarActions = actions ?? {
    createMatch: adminCreateMatchAction,
    updateMatch: adminUpdateMatchAction,
    deleteMatch: adminDeleteMatchAction,
    createTraining: adminCreateTrainingAction,
    updateTraining: adminUpdateTrainingAction,
    deleteTraining: adminDeleteTrainingAction,
  }

  const activeTeams = useMemo(
    () => teams.filter((team) => team.isActive),
    [teams],
  )
  const selectableTeams = activeTeams.length > 0 ? activeTeams : teams
  const teamById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams])
  const selectedMatchTeam = selectableTeams.find((team) => team.id === form.teamId) ?? teams.find((team) => team.id === form.teamId)
  const matchRequiresFullField = selectedMatchTeam ? getTeamDefaultMatchLocation(selectedMatchTeam) === 'Campo completo' : false
  const scheduleDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(scheduleWeekStart, index)),
    [scheduleWeekStart],
  )
  const scheduleDateKeys = useMemo(() => scheduleDays.map(getDateKey), [scheduleDays])
  const scheduleSlots = useMemo(
    () =>
      Array.from(
        { length: ((SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 60) / SCHEDULE_STEP_MINUTES },
        (_, index) => SCHEDULE_START_HOUR * 60 + index * SCHEDULE_STEP_MINUTES,
      ),
    [],
  )
  const weekOptions = useMemo(
    () => Array.from(new Set(matches.map((match) => `${match.weekLabel}|${match.weekRangeLabel}`))),
    [matches],
  )
  const trainingWeekOptions = useMemo(
    () => Array.from(new Set(trainings.map((training) => `${training.weekLabel}|${training.weekRangeLabel}`))),
    [trainings],
  )
  const positionedScheduleEventsByDate = useMemo(() => {
    const eventsByDate = new Map<string, ScheduleEvent[]>()

    for (const match of matches) {
      if (!match.matchTime) continue
      if (!scheduleDateKeys.includes(match.matchDate)) continue
      const startMinute = timeToMinutes(match.matchTime)
      if (startMinute < SCHEDULE_START_HOUR * 60 || startMinute >= SCHEDULE_END_HOUR * 60) continue
      const location = normalizeFieldLocation(match.location)
      const team = teamById.get(match.teamId)

      eventsByDate.set(match.matchDate, [
        ...(eventsByDate.get(match.matchDate) ?? []),
        {
          id: match.id,
          kind: 'match',
          title: `${CLUB.shortName} - ${match.opponentName}`,
          subtitle: `${match.categoryName} · ${match.teamName} · ${match.durationLabel} · ${match.location || location}`,
          teamName: match.teamName,
          categoryName: match.categoryName,
          team,
          date: match.matchDate,
          startTime: match.matchTime,
          startMinute,
          durationMinutes: match.durationMinutes,
          location,
          match,
        },
      ])
    }

    for (const training of trainings) {
      if (!training.startTime || !scheduleDateKeys.includes(training.trainingDate)) continue
      const startMinute = timeToMinutes(training.startTime)
      if (startMinute < SCHEDULE_START_HOUR * 60 || startMinute >= SCHEDULE_END_HOUR * 60) continue
      const team = teamById.get(training.teamId)

      eventsByDate.set(training.trainingDate, [
        ...(eventsByDate.get(training.trainingDate) ?? []),
        {
          id: training.id,
          kind: 'training',
          title: training.teamName,
          subtitle: `${training.categoryName} · ${training.durationLabel} · ${training.location}`,
          teamName: training.teamName,
          categoryName: training.categoryName,
          team,
          date: training.trainingDate,
          startTime: training.startTime,
          startMinute,
          durationMinutes: training.durationMinutes,
          location: training.location,
          training,
        },
      ])
    }

    return new Map(
      Array.from(eventsByDate.entries()).map(([date, events]) => [date, positionDayEvents(events)]),
    )
  }, [matches, scheduleDateKeys, teamById, trainings])

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
  const filteredTrainings = trainings.filter((training) => {
    const q = trainingSearch.toLowerCase().trim()
    const searchable = [
      training.weekLabel,
      training.weekRangeLabel,
      training.dateLabel,
      training.timeLabel,
      training.teamName,
      training.categoryName,
      training.durationLabel,
      training.location,
      training.notes,
    ].join(' ').toLowerCase()

    if (q && !searchable.includes(q)) return false
    if (trainingFilters.week && `${training.weekLabel}|${training.weekRangeLabel}` !== trainingFilters.week) return false
    if (trainingFilters.date && !training.dateLabel.toLowerCase().includes(trainingFilters.date.toLowerCase())) return false
    if (trainingFilters.team && training.teamId !== trainingFilters.team) return false
    if (trainingFilters.location && training.location !== trainingFilters.location) return false

    return true
  })
  const hasTrainingFilters = Object.values(trainingFilters).some(Boolean)

  function setField<K extends keyof MatchFormState>(field: K, value: MatchFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function setTrainingField<K extends keyof TrainingFormState>(field: K, value: TrainingFormState[K]) {
    setTrainingForm((current) => ({ ...current, [field]: value }))
  }

  function setFilter<K extends keyof ColumnFilters>(field: K, value: ColumnFilters[K]) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function setTrainingFilter<K extends keyof TrainingFilters>(field: K, value: TrainingFilters[K]) {
    setTrainingFilters((current) => ({ ...current, [field]: value }))
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

  function clearTrainingFilters() {
    setTrainingSearch('')
    setTrainingFilters({
      week: '',
      date: '',
      team: '',
      location: '',
    })
  }

  function openCreate() {
    const defaultTeam = selectableTeams[0]
    setMode('create')
    setEditing(null)
    setDeleteId(null)
    setForm(createEmptyForm(defaultTeam?.id ?? '', getTeamDefaultMatchLocation(defaultTeam)))
    setFormError(null)
    setSheetOpen(true)
  }

  function openCreateFromSchedule(slot: ScheduleSlot) {
    const defaultTeam = selectableTeams[0]
    setMode('create')
    setEditing(null)
    setDeleteId(null)
    setScheduleSlot(null)
    setForm({
      ...createEmptyForm(defaultTeam?.id ?? '', getTeamDefaultMatchLocation(defaultTeam)),
      matchDate: slot.date,
      matchTime: slot.time,
    })
    setFormError(null)
    setSheetOpen(true)
  }

  function openTrainingCreate(slot?: ScheduleSlot) {
    setTrainingMode('create')
    setEditingTraining(null)
    setDeleteTrainingId(null)
    setTrainingForm({
      ...createEmptyTrainingForm(selectableTeams[0]?.id ?? ''),
      trainingDate: slot?.date ?? '',
      startTime: slot?.time ?? '',
    })
    setTrainingError(null)
    setScheduleSlot(null)
    setTrainingSheetOpen(true)
  }

  function openEdit(match: AdminMatchRow) {
    const matchTeam = selectableTeams.find((team) => team.id === match.teamId) ?? teams.find((team) => team.id === match.teamId)
    const defaultLocation = getTeamDefaultMatchLocation(matchTeam)
    const location = defaultLocation === 'Campo completo' ? defaultLocation : normalizeFieldLocation(match.location)

    setMode('edit')
    setEditing(match)
    setDeleteId(null)
    setForm({
      teamId: match.teamId,
      opponentName: match.opponentName,
      matchDate: match.matchDate,
      matchTime: match.matchTime,
      durationHours: String(Math.floor(match.durationMinutes / 60)),
      durationMinutes: String(match.durationMinutes % 60),
      location,
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

  function openTrainingEdit(training: AdminTrainingSessionRow) {
    setTrainingMode('edit')
    setEditingTraining(training)
    setDeleteTrainingId(null)
    setTrainingForm(trainingToForm(training))
    setTrainingError(null)
    setTrainingSheetOpen(true)
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
    const team = selectableTeams.find((team) => team.id === form.teamId) ?? teams.find((team) => team.id === form.teamId)
    const defaultLocation = getTeamDefaultMatchLocation(team)

    return {
      teamId: form.teamId,
      opponentName: form.opponentName.trim(),
      matchDate: form.matchDate,
      matchTime: form.matchTime,
      durationHours: Number(form.durationHours || 0),
      durationMinutes: Number(form.durationMinutes || 0),
      location: defaultLocation === 'Campo completo' ? defaultLocation : form.location,
      isHome: form.isHome,
      matchType: form.matchType,
      roundLabel: form.roundLabel.trim(),
      status: form.status,
      homeScore,
      awayScore,
      notes: form.notes.trim(),
    }
  }

  function buildTrainingPayload(): TrainingActionInput {
    return {
      teamId: trainingForm.teamId,
      trainingDate: trainingForm.trainingDate,
      startTime: trainingForm.startTime,
      durationHours: Number(trainingForm.durationHours || 0),
      durationMinutes: Number(trainingForm.durationMinutes || 0),
      location: trainingForm.location,
      notes: trainingForm.notes.trim(),
    }
  }

  function validateForm() {
    const durationHours = Number(form.durationHours || 0)
    const durationMinutes = Number(form.durationMinutes || 0)

    if (!form.teamId) return 'Selecciona un equipo.'
    if (!form.opponentName.trim()) return 'Introduce el rival.'
    if (!form.matchDate) return 'Introduce la fecha del partido.'
    if (!form.matchTime) return 'Introduce la hora del partido.'
    if (durationHours <= 0 && durationMinutes <= 0) return 'Introduce una duración mayor que cero.'
    if (durationMinutes > 59) return 'Los minutos deben estar entre 0 y 59.'
    if (!FIELD_LOCATIONS.includes(form.location)) return 'Selecciona un campo válido.'
    if (form.matchType === 'league' && !form.roundLabel.trim()) return 'Introduce la jornada de liga.'
    if (form.status === 'played' && (!form.homeScore.trim() || !form.awayScore.trim())) {
      return 'Introduce el resultado para marcar el partido como jugado.'
    }
    return null
  }

  function validateTrainingForm() {
    const durationHours = Number(trainingForm.durationHours || 0)
    const durationMinutes = Number(trainingForm.durationMinutes || 0)

    if (!trainingForm.teamId) return 'Selecciona un equipo.'
    if (!trainingForm.trainingDate) return 'Introduce la fecha del entrenamiento.'
    if (!trainingForm.startTime) return 'Introduce la hora del entrenamiento.'
    if (!TRAINING_LOCATIONS.includes(trainingForm.location)) return 'Selecciona un lugar válido.'
    if (durationHours <= 0 && durationMinutes <= 0) return 'Introduce una duración mayor que cero.'
    if (durationMinutes > 59) return 'Los minutos deben estar entre 0 y 59.'

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

  function handleTrainingSubmit() {
    const validationError = validateTrainingForm()
    if (validationError) {
      setTrainingError(validationError)
      return
    }

    const createTraining = calendarActions.createTraining ?? adminCreateTrainingAction
    const updateTraining = calendarActions.updateTraining ?? adminUpdateTrainingAction
    const payload = buildTrainingPayload()

    startTransition(async () => {
      try {
        if (trainingMode === 'create') {
          await createTraining(payload)
        } else if (editingTraining) {
          await updateTraining({ ...payload, id: editingTraining.id })
        }
        setTrainingSheetOpen(false)
        setEditingTraining(null)
      } catch (error) {
        setTrainingError(error instanceof Error ? error.message : 'No se ha podido guardar el entrenamiento.')
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
          durationHours: Math.floor(resultMatch.durationMinutes / 60),
          durationMinutes: resultMatch.durationMinutes % 60,
          location: normalizeFieldLocation(resultMatch.location),
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
        setSheetOpen(false)
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'No se ha podido eliminar el partido.')
      }
    })
  }

  function handleTrainingDelete(id: string) {
    const deleteTraining = calendarActions.deleteTraining ?? adminDeleteTrainingAction

    startTransition(async () => {
      try {
        await deleteTraining(id)
        setDeleteTrainingId(null)
        setTrainingSheetOpen(false)
      } catch (error) {
        setTrainingError(error instanceof Error ? error.message : 'No se ha podido eliminar el entrenamiento.')
      }
    })
  }

  const eventPlayer = eventPlayerId ? playerForm.find((player) => player.athleteId === eventPlayerId) ?? null : null
  const eventGoalCount = eventPlayer ? parseRequiredStat(eventPlayer.goals) : 0
  const eventYellowCount = eventPlayer ? parseRequiredStat(eventPlayer.yellowCards) : 0
  const eventHasRedCard = Boolean(eventPlayer && (eventPlayer.redCard || parseRequiredStat(eventPlayer.yellowCards) >= 2))
  const eventGoalMinutes = eventPlayer ? getMinuteFields(eventPlayer.goalMinutes, eventGoalCount) : []
  const eventYellowMinutes = eventPlayer ? getMinuteFields(eventPlayer.yellowCardMinutes, eventYellowCount) : []
  const editingTeamColor = editingTeamColorId ? teams.find((team) => team.id === editingTeamColorId) ?? null : null
  const selectedColorRgb = hexToRgb(selectedTeamColor)

  function openTeamColorEditor(team: AdminTeamRow) {
    setEditingTeamColorId(team.id)
    setSelectedTeamColor(getTeamColor(team, teamColorMap))
    setColorActionError(null)
  }

  function handleSaveTeamColor() {
    if (!editingTeamColor) return
    const parsedColor = normalizeHexColor(selectedTeamColor)

    if (!parsedColor) {
      setColorActionError('Selecciona un color válido.')
      return
    }

    setColorActionError(null)
    startTransition(async () => {
      try {
        await TEAM_COLOR_ACTIONS.update(editingTeamColor.id, parsedColor)
        setTeamColorMap((current) => ({ ...current, [editingTeamColor.id]: parsedColor }))
        setEditingTeamColorId(null)
      } catch (error) {
        setColorActionError(error instanceof Error ? error.message : 'No se ha podido guardar el color.')
      }
    })
  }

  function handleResetTeamColor(team: AdminTeamRow) {
    setColorActionError(null)
    startTransition(async () => {
      try {
        await TEAM_COLOR_ACTIONS.reset(team.id)
        setTeamColorMap((current) => {
          const next = { ...current }
          delete next[team.id]
          return next
        })
        setSelectedTeamColor(getDefaultTeamColor(team))
      } catch (error) {
        setColorActionError(error instanceof Error ? error.message : 'No se ha podido restablecer el color.')
      }
    })
  }

  function handleResetAllTeamColors() {
    setColorActionError(null)
    startTransition(async () => {
      try {
        await TEAM_COLOR_ACTIONS.resetAll()
        setTeamColorMap({})
        setEditingTeamColorId(null)
      } catch (error) {
        setColorActionError(error instanceof Error ? error.message : 'No se han podido restablecer los colores.')
      }
    })
  }

  return (
    <div className="space-y-5">
      {showCoordinatorSections ? (
        <div className="flex flex-wrap gap-2 border-b border-border pb-3" role="tablist" aria-label="Secciones del calendario">
          {[
            { id: 'horario', label: 'Horario' },
            { id: 'entrenamientos', label: 'Entrenamientos' },
            { id: 'partidos', label: 'Partidos' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeCoordinatorTab === tab.id}
              onClick={() => setActiveCoordinatorTab(tab.id as CoordinatorCalendarTab)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-black uppercase transition-colors',
                activeCoordinatorTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white/75 text-muted-foreground ring-1 ring-foreground/10 hover:bg-primary/10 hover:text-primary',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      {showCoordinatorSections && activeCoordinatorTab === 'horario' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setScheduleWeekStart(getWeekStart(new Date()))}>
                Hoy
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Semana anterior"
                onClick={() => setScheduleWeekStart((current) => addDays(current, -7))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Semana siguiente"
                onClick={() => setScheduleWeekStart((current) => addDays(current, 7))}
              >
                <ChevronRight className="size-4" />
              </Button>
              <h2 className="ml-2 text-xl font-black text-foreground">{formatWeekTitle(scheduleWeekStart)}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setTeamColorsOpen(true)}>
                <Palette className="size-4 text-primary" aria-hidden="true" />
                Colores
              </Button>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-black uppercase text-muted-foreground ring-1 ring-foreground/10">
                <CalendarDays className="size-4 text-primary" aria-hidden="true" />
                Semana
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl bg-white/82 shadow-sm ring-1 ring-foreground/10 backdrop-blur lg:overflow-visible">
            <div className="min-w-[1330px]">
              <div className="sticky top-12 z-20 grid grid-cols-[72px_repeat(7,minmax(180px,1fr))] border-b border-border bg-white/95 shadow-sm backdrop-blur">
                <div className="border-r border-border bg-white/95" />
                {scheduleDays.map((day) => {
                  const isToday = getDateKey(day) === getDateKey(new Date())

                  return (
                    <div
                      key={getDateKey(day)}
                      className={cn(
                        'border-r border-border px-3 py-3 last:border-r-0',
                        isToday ? 'bg-primary/10 text-primary' : 'bg-white/95 text-foreground',
                      )}
                    >
                      <p className="text-sm font-black capitalize">{formatShortDay(day)}</p>
                      <p className="mt-1 text-lg font-black">{formatDayNumber(day)}</p>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-[72px_repeat(7,minmax(180px,1fr))]">
                <div className="border-r border-border bg-muted/20">
                  {scheduleSlots.map((slot) => (
                    <div
                      key={slot}
                      className={cn(
                        'flex items-start justify-end border-b border-dotted border-border/70 pr-2 pt-0.5 text-[11px] font-semibold text-muted-foreground',
                        slot % 60 === 0 && 'border-b-border text-foreground',
                      )}
                      style={{ height: SCHEDULE_ROW_HEIGHT }}
                    >
                      {slot % 60 === 0 ? minutesToTime(slot) : ''}
                    </div>
                  ))}
                </div>

                {scheduleDays.map((day) => {
                  const date = getDateKey(day)
                  const dayEvents = positionedScheduleEventsByDate.get(date) ?? []

                  return (
                    <div
                      key={date}
                      className="relative border-r border-border last:border-r-0"
                      style={{ height: scheduleSlots.length * SCHEDULE_ROW_HEIGHT }}
                    >
                      {scheduleSlots.map((slot) => {
                        const time = minutesToTime(slot)

                        return (
                          <button
                            key={`${date}-${time}`}
                            type="button"
                            className={cn(
                              'absolute left-0 right-0 border-b border-dotted border-border/70 transition-colors hover:bg-primary/5 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              slot % 60 === 0 && 'border-b-border',
                            )}
                            style={{
                              top: ((slot - SCHEDULE_START_HOUR * 60) / SCHEDULE_STEP_MINUTES) * SCHEDULE_ROW_HEIGHT,
                              height: SCHEDULE_ROW_HEIGHT,
                            }}
                            aria-label={`Crear el ${date} a las ${time}`}
                            onClick={() => setScheduleSlot({ date, time })}
                          />
                        )
                      })}

                      {dayEvents.map((event) => {
                        const top = ((event.startMinute - SCHEDULE_START_HOUR * 60) / SCHEDULE_STEP_MINUTES) * SCHEDULE_ROW_HEIGHT
                        const height = Math.max(22, (event.durationMinutes / SCHEDULE_STEP_MINUTES) * SCHEDULE_ROW_HEIGHT - 4)
                        const gap = 4
                        const width = `calc((100% - ${gap * (event.laneCount + 1)}px) / ${event.laneCount})`
                        const left = `calc(${event.lane} * ((100% - ${gap * (event.laneCount + 1)}px) / ${event.laneCount}) + ${gap * (event.lane + 1)}px)`
                        const eventColor = getScheduleEventColor(event, teamColorMap)

                        return (
                          <button
                            key={`${event.kind}-${event.id}`}
                            type="button"
                            className={cn(
                              'absolute z-10 overflow-y-auto rounded-md border px-2 py-1 text-left text-white transition-transform hover:z-20 hover:-translate-y-0.5 focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              event.kind === 'training' && 'border-dashed',
                            )}
                            style={{ top, height, width, left, ...eventColor }}
                            onClick={() => (event.kind === 'match' && event.match ? openEdit(event.match) : event.training ? openTrainingEdit(event.training) : null)}
                            title={`${event.title} · ${minutesToTime(event.startMinute)}-${addMinutesToTime(event.startTime, event.durationMinutes)} · ${event.location}`}
                          >
                            <p className="whitespace-normal break-words text-[11px] font-black leading-tight">{event.title}</p>
                            <p className="mt-0.5 whitespace-normal break-words text-[10px] font-bold leading-tight opacity-95">
                              {minutesToTime(event.startMinute)}-{addMinutesToTime(event.startTime, event.durationMinutes)}
                            </p>
                            <p className="mt-0.5 whitespace-normal break-words text-[10px] font-semibold leading-tight opacity-95">{event.subtitle}</p>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {showCoordinatorSections && activeCoordinatorTab === 'entrenamientos' ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button size="sm" onClick={() => openTrainingCreate()} disabled={selectableTeams.length === 0}>
              <Plus className="size-4" aria-hidden="true" />
              Nuevo entrenamiento
            </Button>
          </div>

          {selectableTeams.length === 0 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
              Crea al menos un equipo antes de programar entrenamientos.
            </p>
          ) : null}

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={trainingSearch}
                onChange={(event) => setTrainingSearch(event.target.value)}
                placeholder="Buscar entrenamientos"
                className="pl-9"
              />
            </div>
            {trainingSearch || hasTrainingFilters ? (
              <Button variant="outline" size="sm" onClick={clearTrainingFilters}>
                <X className="size-3.5" />
                Limpiar
              </Button>
            ) : null}
          </div>

          <div className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-foreground/10 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="training-filter-week">Semana</Label>
              <select
                id="training-filter-week"
                value={trainingFilters.week}
                onChange={(event) => setTrainingFilter('week', event.target.value)}
                className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Todas</option>
                {trainingWeekOptions.map((option) => {
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
              <Label htmlFor="training-filter-date">Fecha</Label>
              <Input
                id="training-filter-date"
                value={trainingFilters.date}
                onChange={(event) => setTrainingFilter('date', event.target.value)}
                placeholder="dd/mm/aaaa"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="training-filter-team">Equipo</Label>
              <select
                id="training-filter-team"
                value={trainingFilters.team}
                onChange={(event) => setTrainingFilter('team', event.target.value)}
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
              <Label htmlFor="training-filter-location">Lugar</Label>
              <select
                id="training-filter-location"
                value={trainingFilters.location}
                onChange={(event) => setTrainingFilter('location', event.target.value)}
                className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Todos</option>
                {TRAINING_LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full text-center text-sm">
              <thead>
                <tr className="border-b border-border bg-blue-50 text-xs font-bold text-blue-950">
                  <th className="px-4 py-2.5 text-center">Semana</th>
                  <th className="px-4 py-2.5 text-center">Fecha</th>
                  <th className="px-4 py-2.5 text-center">Equipo</th>
                  <th className="px-4 py-2.5 text-center">Hora</th>
                  <th className="px-4 py-2.5 text-center">Duración</th>
                  <th className="px-4 py-2.5 text-center">Lugar</th>
                  <th className="px-4 py-2.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {filteredTrainings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">
                      No hay entrenamientos registrados todavía.
                    </td>
                  </tr>
                ) : (
                  filteredTrainings.map((training) => {
                    const isDeleting = deleteTrainingId === training.id

                    return (
                      <tr key={training.id} className={cn('transition-colors hover:bg-muted/30', isDeleting && 'bg-destructive/5')}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{training.weekLabel}</div>
                          <div className="text-xs font-semibold text-muted-foreground">{training.weekRangeLabel}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{training.dateLabel}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{training.teamName}</div>
                          <div className="text-xs font-semibold text-muted-foreground">{training.categoryName}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{training.timeLabel}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{training.durationLabel}</td>
                        <td className="px-4 py-3 text-muted-foreground">{training.location}</td>
                        <td className="px-4 py-3">
                          {isDeleting ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                              <Button size="sm" variant="destructive" disabled={isPending} onClick={() => handleTrainingDelete(training.id)}>
                                Sí, eliminar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setDeleteTrainingId(null)}>
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => openTrainingEdit(training)}>
                                <Pencil className="size-3.5" aria-hidden="true" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setDeleteTrainingId(training.id)}
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
        </section>
      ) : null}

      {!showCoordinatorSections || activeCoordinatorTab === 'partidos' ? (
      <section className="space-y-5">

      <div className="flex flex-wrap items-center justify-between gap-3">
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

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="border-b border-border bg-blue-50 text-xs font-bold text-blue-950">
              <th className="px-4 py-2.5 text-center">Jornada</th>
              <th className="px-4 py-2.5 text-center">Fecha</th>
              <th className="px-4 py-2.5 text-center">Partido</th>
              <th className="px-4 py-2.5 text-center">Competición</th>
              <th className="px-4 py-2.5 text-center">Duración</th>
              <th className="px-4 py-2.5 text-center">Lugar</th>
              <th className="px-4 py-2.5 text-center">Estado</th>
              <th className="px-4 py-2.5 text-center">Resultado</th>
              <th className="px-4 py-2.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {filteredMatches.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-14 text-center text-sm text-muted-foreground">
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
                    <td className="px-4 py-3 font-semibold text-foreground">{match.durationLabel}</td>
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
      </section>
      ) : null}

      <AdminFormDialog
        open={Boolean(scheduleSlot)}
        onOpenChange={(open) => {
          if (!open) setScheduleSlot(null)
        }}
        title="Crear en horario"
        description={scheduleSlot ? `${scheduleSlot.date} a las ${scheduleSlot.time}` : undefined}
        maxWidth="md"
        footer={
          <Button variant="outline" onClick={() => setScheduleSlot(null)}>
            Cancelar
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            className="h-24 flex-col items-start justify-center gap-2 px-4 text-left"
            disabled={!scheduleSlot || selectableTeams.length === 0}
            onClick={() => {
              if (scheduleSlot) openCreateFromSchedule(scheduleSlot)
            }}
          >
            <CalendarDays className="size-5" aria-hidden="true" />
            <span className="text-base font-black">Partido</span>
            <span className="text-xs font-semibold opacity-85">Duración configurable</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-24 flex-col items-start justify-center gap-2 px-4 text-left"
            disabled={!scheduleSlot || selectableTeams.length === 0}
            onClick={() => {
              if (scheduleSlot) openTrainingCreate(scheduleSlot)
            }}
          >
            <ClipboardList className="size-5" aria-hidden="true" />
            <span className="text-base font-black">Entrenamiento</span>
            <span className="text-xs font-semibold text-muted-foreground">Duración configurable</span>
          </Button>
        </div>

        {selectableTeams.length === 0 ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
            Crea al menos un equipo antes de programar el horario.
          </p>
        ) : null}
      </AdminFormDialog>

      <AdminFormDialog
        open={trainingSheetOpen}
        onOpenChange={setTrainingSheetOpen}
        title={trainingMode === 'create' ? 'Nuevo entrenamiento' : 'Editar entrenamiento'}
        description="Programa el equipo, hora, duración y campo del entrenamiento."
        maxWidth="lg"
        footer={
          <>
            {trainingMode === 'edit' && editingTraining ? (
              <Button variant="destructive" onClick={() => handleTrainingDelete(editingTraining.id)} disabled={isPending}>
                <Trash2 className="size-4" />
                Eliminar
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setTrainingSheetOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleTrainingSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : trainingMode === 'create' ? <Plus className="size-4" /> : <Pencil className="size-4" />}
              {trainingMode === 'create' ? 'Crear entrenamiento' : 'Guardar cambios'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="training-team">Equipo</Label>
            <select
              id="training-team"
              value={trainingForm.teamId}
              onChange={(event) => setTrainingField('teamId', event.target.value)}
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
            <Label htmlFor="training-location">Lugar</Label>
            <select
              id="training-location"
              value={trainingForm.location}
              onChange={(event) => setTrainingField('location', event.target.value as TrainingLocation)}
              className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {TRAINING_LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="training-date">Fecha</Label>
            <Input
              id="training-date"
              type="date"
              value={trainingForm.trainingDate}
              onChange={(event) => setTrainingField('trainingDate', event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="training-time">Hora</Label>
            <Input
              id="training-time"
              type="time"
              value={trainingForm.startTime}
              onChange={(event) => setTrainingField('startTime', event.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="training-duration-hours">Duración horas</Label>
              <Input
                id="training-duration-hours"
                type="number"
                min="0"
                max="6"
                step="1"
                value={trainingForm.durationHours}
                onChange={(event) => setTrainingField('durationHours', event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="training-duration-minutes">Duración minutos</Label>
              <Input
                id="training-duration-minutes"
                type="number"
                min="0"
                max="59"
                step="1"
                value={trainingForm.durationMinutes}
                onChange={(event) => setTrainingField('durationMinutes', event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="training-notes">Notas</Label>
            <textarea
              id="training-notes"
              value={trainingForm.notes}
              onChange={(event) => setTrainingField('notes', event.target.value)}
              className="min-h-24 rounded-lg border border-input bg-white px-3 py-2 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="Observaciones internas"
            />
          </div>
        </div>

      </AdminFormDialog>

      <AdminFormDialog
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={mode === 'create' ? 'Nuevo partido' : 'Editar partido'}
        description={mode === 'create' ? 'Programa un partido para uno de los equipos del club.' : 'Actualiza la fecha, estado o datos generales del partido.'}
        maxWidth="xl"
        footer={
          <>
            {mode === 'edit' && editing ? (
              <Button variant="destructive" onClick={() => handleDelete(editing.id)} disabled={isPending}>
                <Trash2 className="size-4" />
                Eliminar
              </Button>
            ) : null}
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
              onChange={(event) => {
                const teamId = event.target.value
                const nextTeam = selectableTeams.find((team) => team.id === teamId)
                setForm((current) => ({
                  ...current,
                  teamId,
                  location: getTeamDefaultMatchLocation(nextTeam),
                }))
              }}
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

          <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="match-duration-hours">Duración horas</Label>
              <Input
                id="match-duration-hours"
                type="number"
                min="0"
                max="6"
                step="1"
                value={form.durationHours}
                onChange={(event) => setField('durationHours', event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="match-duration-minutes">Duración minutos</Label>
              <Input
                id="match-duration-minutes"
                type="number"
                min="0"
                max="59"
                step="1"
                value={form.durationMinutes}
                onChange={(event) => setField('durationMinutes', event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="match-location">Campo</Label>
            {matchRequiresFullField ? (
              <Input id="match-location" value="Campo completo" readOnly className="font-semibold text-muted-foreground" />
            ) : (
              <select
                id="match-location"
                value={form.location}
                onChange={(event) => setField('location', event.target.value as TrainingLocation)}
                className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {FIELD_LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            )}
            {selectedMatchTeam ? (
              <p className="text-xs font-semibold text-muted-foreground">
                {matchRequiresFullField
                  ? 'Esta categoría usa campo completo por defecto.'
                  : 'Puedes elegir medio campo, campo completo o anexo.'}
              </p>
            ) : null}
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

      <AdminFormDialog
        open={teamColorsOpen}
        onOpenChange={(open) => {
          setTeamColorsOpen(open)
          if (!open) {
            setEditingTeamColorId(null)
            setColorActionError(null)
          }
        }}
        title="Colores de equipos"
        description="Personaliza cómo se muestran los equipos en el horario semanal."
        maxWidth="2xl"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleResetAllTeamColors} disabled={isPending}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Restablecer todos
            </Button>
            <Button type="button" onClick={() => setTeamColorsOpen(false)}>
              Aceptar
            </Button>
          </div>
        }
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-0 rounded-lg border border-border bg-white">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-black text-foreground">Equipos</p>
            </div>
            <div className="max-h-[52vh] overflow-y-auto">
              {teams.map((team) => {
                const color = getTeamColor(team, teamColorMap)
                const isEditing = editingTeamColorId === team.id

                return (
                  <div
                    key={team.id}
                    className={cn(
                      'grid gap-3 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center',
                      isEditing && 'bg-primary/5',
                    )}
                  >
                    <span
                      className="size-9 rounded-full border border-foreground/10 shadow-sm"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-foreground">{team.nombre}</p>
                      <p className="truncate text-xs font-semibold text-muted-foreground">{team.categoria} · {team.temporada}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openTeamColorEditor(team)}>
                        <Palette className="size-4" aria-hidden="true" />
                        Cambiar
                      </Button>
                      {teamColorMap[team.id] ? (
                        <Button type="button" variant="ghost" size="icon-sm" aria-label="Restablecer color" onClick={() => handleResetTeamColor(team)} disabled={isPending}>
                          <RotateCcw className="size-4" aria-hidden="true" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <aside className="rounded-lg border border-border bg-[#f8fafc] p-4">
            {editingTeamColor ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span
                    className="size-12 rounded-full border border-foreground/10 shadow-sm"
                    style={{ backgroundColor: selectedTeamColor }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-foreground">{editingTeamColor.nombre}</p>
                    <p className="truncate text-xs font-semibold text-muted-foreground">{editingTeamColor.categoria}</p>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-black uppercase text-muted-foreground">Paleta</p>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedTeamColor(getDefaultTeamColor(editingTeamColor))}>
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Base
                    </Button>
                  </div>
                  <div className="grid grid-cols-10 gap-2">
                    {TEAM_COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'size-7 rounded-full border border-foreground/10 ring-offset-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selectedTeamColor === color.toLowerCase() && 'ring-2 ring-primary',
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Color ${color}`}
                        onClick={() => setSelectedTeamColor(color.toLowerCase())}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs font-black uppercase text-muted-foreground">Estándar</p>
                  <div className="flex flex-wrap gap-2">
                    {STANDARD_TEAM_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'size-8 rounded-full border border-foreground/10 ring-offset-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selectedTeamColor === color.toLowerCase() && 'ring-2 ring-primary',
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Color estándar ${color}`}
                        onClick={() => setSelectedTeamColor(color.toLowerCase())}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="mb-3 text-xs font-black uppercase text-muted-foreground">Personalizado</p>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3">
                      <Input
                        type="color"
                        value={normalizeHexColor(selectedTeamColor) ?? '#000000'}
                        onChange={(event) => setSelectedTeamColor(event.target.value.toLowerCase())}
                        className="h-11 w-16 cursor-pointer p-1"
                        aria-label="Seleccionar color personalizado"
                      />
                      <div className="inline-flex size-11 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground">
                        <Pipette className="size-5" aria-hidden="true" />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
                        Hexadecimal
                        <Input
                          value={selectedTeamColor}
                          onChange={(event) => setSelectedTeamColor(event.target.value)}
                          className="h-10 bg-white"
                        />
                      </label>
                      {([
                        { label: 'R', value: selectedColorRgb.red, channel: 'red' },
                        { label: 'V', value: selectedColorRgb.green, channel: 'green' },
                        { label: 'A', value: selectedColorRgb.blue, channel: 'blue' },
                      ] as const).map((channel) => (
                        <label key={channel.label} className="grid gap-1 text-xs font-semibold text-muted-foreground">
                          {channel.label}
                          <Input
                            type="number"
                            min={0}
                            max={255}
                            value={channel.value}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value)
                              const nextRgb = { ...selectedColorRgb }
                              nextRgb[channel.channel] = nextValue
                              setSelectedTeamColor(rgbToHex(nextRgb.red, nextRgb.green, nextRgb.blue))
                            }}
                            className="h-10 bg-white"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {colorActionError ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-100">
                    {colorActionError}
                  </p>
                ) : null}

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditingTeamColorId(null)}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleSaveTeamColor} disabled={isPending}>
                    {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Palette className="size-4" aria-hidden="true" />}
                    Guardar color
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-white/70 p-6 text-center">
                <Palette className="size-8 text-primary" aria-hidden="true" />
                <p className="mt-3 text-sm font-black text-foreground">Selecciona un equipo</p>
                <p className="mt-1 text-sm text-muted-foreground">Pulsa Cambiar para editar su color.</p>
              </div>
            )}
          </aside>
        </div>
      </AdminFormDialog>

      <AdminErrorDialog message={formError} onClose={() => setFormError(null)} />
      <AdminErrorDialog message={trainingError} onClose={() => setTrainingError(null)} />
    </div>
  )
}
