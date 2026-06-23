'use client'

import { useMemo, useState, useTransition } from 'react'
import { CalendarDays, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { AdminFormDialog } from '@/components/admin-form-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CLUB } from '@/lib/club'
import type { AdminMatchRow, AdminMatchStatus, AdminMatchType, AdminTeamRow } from '@/lib/admin-app'
import { cn } from '@/lib/utils'
import { createMatchAction, deleteMatchAction, updateMatchAction } from './actions'

type Props = {
  matches: AdminMatchRow[]
  teams: AdminTeamRow[]
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

function getScoreLabel(match: AdminMatchRow) {
  if (match.status !== 'played' || match.homeScore === null || match.awayScore === null) {
    return '-'
  }

  const clubScore = match.isHome ? match.homeScore : match.awayScore
  const opponentScore = match.isHome ? match.awayScore : match.homeScore

  return `${clubScore} - ${opponentScore}`
}

export function CalendarioClient({ matches, teams }: Props) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<ColumnFilters>({
    week: '',
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
  const [resultForm, setResultForm] = useState<ResultFormState>({ clubScore: '', opponentScore: '' })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<MatchFormState>(() => createEmptyForm(teams[0]?.id ?? ''))
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
    setResultForm({
      clubScore: match.status === 'played'
        ? scoreToString(match.isHome ? match.homeScore : match.awayScore)
        : '',
      opponentScore: match.status === 'played'
        ? scoreToString(match.isHome ? match.awayScore : match.homeScore)
        : '',
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
          await createMatchAction(payload)
        } else if (editing) {
          await updateMatchAction({ ...payload, id: editing.id })
        }
        setSheetOpen(false)
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'No se ha podido guardar el partido.')
      }
    })
  }

  function handleResultSubmit() {
    if (!resultMatch) return
    if (!resultForm.clubScore.trim() || !resultForm.opponentScore.trim()) {
      setFormError('Introduce el resultado del club y del rival.')
      return
    }

    const clubScore = Number(resultForm.clubScore)
    const opponentScore = Number(resultForm.opponentScore)

    if (!Number.isInteger(clubScore) || !Number.isInteger(opponentScore) || clubScore < 0 || opponentScore < 0) {
      setFormError('El resultado debe tener números enteros válidos.')
      return
    }

    setFormError(null)
    startTransition(async () => {
      try {
        await updateMatchAction({
          id: resultMatch.id,
          teamId: resultMatch.teamId,
          opponentName: resultMatch.opponentName,
          matchDate: resultMatch.matchDate,
          matchTime: resultMatch.matchTime,
          location: resultMatch.location,
          isHome: resultMatch.isHome,
          matchType: resultMatch.matchType,
          roundLabel: resultMatch.roundLabel,
          status: 'played',
          homeScore: resultMatch.isHome ? clubScore : opponentScore,
          awayScore: resultMatch.isHome ? opponentScore : clubScore,
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
        await deleteMatchAction(id)
        setDeleteId(null)
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'No se ha podido eliminar el partido.')
      }
    })
  }

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
          Crea al menos un equipo antes de programar partidos.
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

      <div className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-foreground/10 md:grid-cols-3 xl:grid-cols-7">
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
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-center text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
              <th className="px-4 py-2.5 text-center">Semana</th>
              <th className="px-4 py-2.5 text-center">Fecha</th>
              <th className="px-4 py-2.5 text-center">Equipo</th>
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
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{match.weekLabel}</div>
                      <div className="text-xs text-muted-foreground">{match.weekRangeLabel}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{match.dateLabel}</div>
                      <div className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" aria-hidden="true" />
                        {match.timeLabel}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{match.teamName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {CLUB.shortName} vs {match.opponentName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {match.isHome ? 'Como local' : 'Como visitante'} · {match.seasonName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">
                        {MATCH_TYPE_LABELS[match.matchType]}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {match.matchType === 'league' ? match.roundLabel : 'Sin jornada'}
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
                            <CalendarDays className="size-3.5" aria-hidden="true" />
                            Resultado
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
        description={mode === 'create' ? 'Programa un partido para uno de los equipos del club.' : 'Actualiza la fecha, estado o resultado del partido.'}
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

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="home-score">Goles local</Label>
              <Input
                id="home-score"
                type="number"
                min="0"
                value={form.homeScore}
                onChange={(event) => setField('homeScore', event.target.value)}
                disabled={form.status !== 'played'}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="away-score">Goles visitante</Label>
              <Input
                id="away-score"
                type="number"
                min="0"
                value={form.awayScore}
                onChange={(event) => setField('awayScore', event.target.value)}
                disabled={form.status !== 'played'}
              />
            </div>
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
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {formError}
          </p>
        ) : null}
      </AdminFormDialog>

      <AdminFormDialog
        open={Boolean(resultMatch)}
        onOpenChange={(open) => {
          if (!open) setResultMatch(null)
        }}
        title="Añadir resultado"
        description={resultMatch ? `${CLUB.shortName} vs ${resultMatch.opponentName}` : 'Actualiza el resultado del partido.'}
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setResultMatch(null)}>
              Cancelar
            </Button>
            <Button onClick={handleResultSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CalendarDays className="size-4" />}
              Guardar resultado
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-club-score">Goles {CLUB.shortName}</Label>
            <Input
              id="quick-club-score"
              type="number"
              min="0"
              value={resultForm.clubScore}
              onChange={(event) => setResultForm((current) => ({ ...current, clubScore: event.target.value }))}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-opponent-score">Goles rival</Label>
            <Input
              id="quick-opponent-score"
              type="number"
              min="0"
              value={resultForm.opponentScore}
              onChange={(event) => setResultForm((current) => ({ ...current, opponentScore: event.target.value }))}
            />
          </div>
        </div>

        {resultMatch ? (
          <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
            Se guardará como partido jugado: {CLUB.shortName} {resultForm.clubScore || '0'} - {resultForm.opponentScore || '0'} {resultMatch.opponentName}
          </p>
        ) : null}

        {formError ? (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {formError}
          </p>
        ) : null}
      </AdminFormDialog>
    </div>
  )
}
