import Link from 'next/link'
import { CalendarDays, Clock, Filter, MapPin, Trophy } from 'lucide-react'
import { BrandedPageHero } from '@/components/branded-page-hero'
import { MatchCountdown } from '@/components/match-countdown'
import { CLUB } from '@/lib/club'
import {
  getClubScore,
  getCompetitionLabel,
  getOpponentScore,
  getTodayDateString,
  type PublicCalendarData,
  type PublicCalendarMatch,
} from '@/lib/calendar'
import { cn } from '@/lib/utils'

type CalendarPublicViewProps = {
  data: PublicCalendarData
  filters: {
    season?: string
    team?: string
    competition?: string
    status?: string
  }
}

const STATUS_LABELS = {
  scheduled: 'Programado',
  played: 'Jugado',
  postponed: 'Aplazado',
  cancelled: 'Cancelado',
} as const

const STATUS_STYLES = {
  scheduled: 'bg-blue-100 text-blue-700',
  played: 'bg-emerald-100 text-emerald-700',
  postponed: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-slate-100 text-slate-700',
} as const

function normalizeFilter(value?: string) {
  return value && value !== 'all' ? value : ''
}

function getSelectedSeason(data: PublicCalendarData, season?: string) {
  const requested = normalizeFilter(season)
  if (requested && data.seasons.some((item) => item.id === requested)) return requested
  return data.seasons.find((item) => item.isActive)?.id ?? data.seasons[0]?.id ?? ''
}

function isUpcomingMatch(match: PublicCalendarMatch, today: string) {
  return match.status !== 'played' && match.matchDate >= today
}

function getScoreLabel(match: PublicCalendarMatch) {
  const clubScore = getClubScore(match)
  const opponentScore = getOpponentScore(match)

  if (clubScore === null || opponentScore === null) return null
  return `${clubScore} - ${opponentScore}`
}

function filterMatches(
  matches: PublicCalendarMatch[],
  filters: CalendarPublicViewProps['filters'],
  selectedSeason: string,
) {
  const today = getTodayDateString()
  const team = normalizeFilter(filters.team)
  const competition = normalizeFilter(filters.competition)
  const status = filters.status || 'all'

  return matches.filter((match) => {
    if (selectedSeason && match.seasonId !== selectedSeason) return false
    if (team && match.teamId !== team) return false
    if (competition && match.matchType !== competition) return false
    if (status === 'upcoming' && !isUpcomingMatch(match, today)) return false
    if (status === 'played' && match.status !== 'played') return false

    return true
  })
}

function getFeaturedMatch(matches: PublicCalendarMatch[], status: string | undefined) {
  const today = getTodayDateString()

  if (status === 'played') {
    return [...matches]
      .filter((match) => match.status === 'played')
      .sort((a, b) => b.matchDate.localeCompare(a.matchDate) || b.matchTime.localeCompare(a.matchTime))[0] ?? null
  }

  return [...matches]
    .filter((match) => isUpcomingMatch(match, today))
    .sort((a, b) => a.matchDate.localeCompare(b.matchDate) || a.matchTime.localeCompare(b.matchTime))[0] ?? null
}

function groupByMonth(matches: PublicCalendarMatch[]) {
  const groups = new Map<string, { label: string; matches: PublicCalendarMatch[] }>()

  const orderedMatches = [...matches].sort(
    (a, b) => b.matchDate.localeCompare(a.matchDate) || b.matchTime.localeCompare(a.matchTime),
  )

  for (const match of orderedMatches) {
    const group = groups.get(match.monthKey) ?? { label: match.monthLabel, matches: [] }
    group.matches.push(match)
    groups.set(match.monthKey, group)
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, group]) => ({ key, ...group }))
}

function ResultBadge({ match }: { match: PublicCalendarMatch }) {
  const score = getScoreLabel(match)

  if (score) {
    return (
      <span className="inline-flex min-w-20 justify-center rounded-md bg-[#06172f] px-3 py-2 text-base font-black text-white">
        {score}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-black', STATUS_STYLES[match.status])}>
      {STATUS_LABELS[match.status]}
    </span>
  )
}

function FeaturedMatch({ match, isPlayedMode }: { match: PublicCalendarMatch; isPlayedMode: boolean }) {
  const score = getScoreLabel(match)
  const competitionLabel = getCompetitionLabel(match)

  return (
    <section className="relative overflow-hidden bg-[#f4f6f8] text-white shadow-[0_18px_50px_rgba(6,23,47,0.18)]">
      <div className="absolute inset-0 opacity-20" aria-hidden="true">
        <div
          className="size-full"
          style={{
            backgroundImage:
              'linear-gradient(135deg, rgba(255,255,255,0.14) 0 1px, transparent 1px 52px)',
            backgroundSize: '52px 52px',
          }}
        />
      </div>
      <div className="absolute inset-y-0 left-0 hidden w-[34%] bg-primary lg:block" aria-hidden="true" />
      <div className="absolute inset-y-0 left-[27%] hidden w-72 bg-gradient-to-r from-primary to-transparent lg:block" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-7xl lg:grid-cols-[0.68fr_1.62fr]">
          <div className="relative bg-primary px-4 py-8 md:px-8 md:py-10 lg:bg-transparent">
            <p className="text-xs font-black uppercase tracking-[0.34em] text-white/72">
              {isPlayedMode ? 'Resultado destacado' : 'Próximo partido'}
            </p>
            <h2 className="mt-4 text-5xl font-black leading-none tracking-tight md:text-6xl">
              {match.teamName}
            </h2>
            <div className="mt-6 inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-black ring-1 ring-white/18">
              {getCompetitionLabel(match)} · {match.seasonName}
            </div>
          </div>

          <div className="relative flex flex-col justify-center overflow-hidden bg-[#102846] px-4 py-10 text-center md:px-8 md:py-12 lg:px-20">
            <div
              className="absolute inset-0 opacity-70"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(circle at 50% 12%, rgba(47,123,205,0.35), transparent 24rem), linear-gradient(135deg, rgba(255,255,255,0.06), transparent 45%), linear-gradient(180deg, transparent, rgba(6,23,47,0.4))',
              }}
            />
            <div className="relative mx-auto flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/12">
              <Trophy className="size-6 text-white/90" aria-hidden="true" />
            </div>
            <p className="relative mt-4 text-sm font-black uppercase tracking-[0.18em] text-white">
              {match.matchType === 'friendly' ? 'Amistosos' : competitionLabel}
            </p>
            <p className="relative mt-2 text-sm font-bold text-white/86">
              {competitionLabel} | {match.location || 'Lugar por confirmar'}
            </p>

            <div className="relative mt-7 grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              <p className="text-3xl font-black leading-tight tracking-tight md:text-4xl">{CLUB.shortName}</p>
              <div className="grid gap-1">
                {score ? (
                  <p className="text-4xl font-black leading-none text-white md:text-5xl">{score}</p>
                ) : (
                  <p className="text-4xl font-black leading-none text-white md:text-5xl">{match.timeLabel}</p>
                )}
                <p className="text-sm font-black text-white/90">{match.dateLabel}</p>
              </div>
              <p className="text-3xl font-black leading-tight tracking-tight md:text-4xl">{match.opponentName}</p>
            </div>

            <MatchCountdown matchDate={match.matchDate} matchTime={match.matchTime} />
          </div>
      </div>
    </section>
  )
}

function MatchRow({ match }: { match: PublicCalendarMatch }) {
  return (
    <article className="grid gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-black/5 md:grid-cols-[130px_1fr_190px_150px] md:items-center">
      <div>
        <p className="text-sm font-black uppercase text-primary">{match.timeLabel}</p>
        <p className="mt-1 text-xs font-bold text-muted-foreground">{match.dayLabel}</p>
        <p className="text-xs font-bold text-muted-foreground">{match.dateLabel}</p>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{match.teamName}</p>
        <h3 className="mt-2 text-xl font-black leading-tight text-foreground">
          {CLUB.shortName} vs {match.opponentName}
        </h3>
        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <MapPin className="size-4 text-primary" aria-hidden="true" />
          {match.location || 'Lugar por confirmar'}
        </p>
      </div>

      <div className="text-sm font-bold text-muted-foreground">
        <p className="text-foreground">{getCompetitionLabel(match)}</p>
        <p>{match.seasonName}</p>
      </div>

      <div className="md:text-right">
        <ResultBadge match={match} />
      </div>
    </article>
  )
}

export function CalendarPublicView({ data, filters }: CalendarPublicViewProps) {
  const selectedSeason = getSelectedSeason(data, filters.season)
  const selectedStatus = filters.status || 'all'
  const visibleTeams = selectedSeason
    ? data.teams.filter((team) => team.seasonId === selectedSeason)
    : data.teams
  const filteredMatches = filterMatches(data.matches, filters, selectedSeason)
  const featuredMatch = getFeaturedMatch(filteredMatches, selectedStatus)
  const monthGroups = groupByMonth(filteredMatches)

  return (
    <section className="bg-[#f4f6f8]">
      <BrandedPageHero
        eyebrow="Partidos y resultados"
        title="Calendario"
      />

      <div className="border-b border-border bg-white/95 shadow-sm">
        <form className="mx-auto grid max-w-7xl gap-3 px-4 py-4 md:grid-cols-4 md:px-8" action="/calendario">
          <label className="flex flex-col gap-1.5 text-sm font-black text-foreground">
            Temporada
            <select name="season" defaultValue={selectedSeason} className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium">
              {data.seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-black text-foreground">
            Equipo
            <select name="team" defaultValue={normalizeFilter(filters.team) || 'all'} className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium">
              <option value="all">Todos</option>
              {visibleTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-black text-foreground">
            Competición
            <select name="competition" defaultValue={normalizeFilter(filters.competition) || 'all'} className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium">
              <option value="all">Todas</option>
              <option value="league">Liga</option>
              <option value="friendly">Amistosos</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-black text-foreground">
            Estado
            <select name="status" defaultValue={selectedStatus} className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium">
              <option value="all">Todos</option>
              <option value="upcoming">Próximos</option>
              <option value="played">Jugados</option>
            </select>
          </label>

          <div className="flex gap-2 md:col-span-4">
            <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-white" type="submit">
              <Filter className="size-4" aria-hidden="true" />
              Filtrar
            </button>
            <Link className="inline-flex h-10 items-center rounded-lg border border-border bg-white px-4 text-sm font-black text-muted-foreground" href="/calendario">
              Limpiar
            </Link>
          </div>
        </form>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-8 md:py-12">
        {monthGroups.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <Trophy className="mx-auto size-10 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black text-foreground">No hay partidos con estos filtros</h2>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Prueba con otra temporada, equipo, competición o estado.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {featuredMatch ? (
              <FeaturedMatch match={featuredMatch} isPlayedMode={selectedStatus === 'played'} />
            ) : null}

            {monthGroups.map((group) => (
              <section key={group.key}>
                <div className="mb-4 flex items-center gap-3">
                  <CalendarDays className="size-5 text-primary" aria-hidden="true" />
                  <h2 className="text-3xl font-black capitalize tracking-tight text-foreground">
                    {group.label}
                  </h2>
                </div>
                <div className="space-y-3">
                  {group.matches.map((match) => (
                    <MatchRow key={match.id} match={match} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
