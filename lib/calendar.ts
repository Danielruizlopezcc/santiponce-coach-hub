import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import { CLUB } from '@/lib/club'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeamCategorySortInfo, getTeamSuffixOrder } from '@/lib/team-order'

export type PublicCalendarMatchStatus = 'scheduled' | 'played' | 'postponed' | 'cancelled'
export type PublicCalendarMatchType = 'league' | 'friendly'

export type PublicCalendarSeason = {
  id: string
  name: string
  isActive: boolean
}

export type PublicCalendarTeam = {
  id: string
  name: string
  categoryName: string
  seasonId: string
}

export type PublicCalendarMatch = {
  id: string
  teamId: string
  teamName: string
  categoryName: string
  seasonId: string
  seasonName: string
  opponentName: string
  matchDate: string
  matchTime: string
  dateLabel: string
  dayLabel: string
  timeLabel: string
  monthKey: string
  monthLabel: string
  location: string
  isHome: boolean
  matchType: PublicCalendarMatchType
  roundLabel: string
  status: PublicCalendarMatchStatus
  homeScore: number | null
  awayScore: number | null
}

export type PublicCalendarData = {
  seasons: PublicCalendarSeason[]
  teams: PublicCalendarTeam[]
  matches: PublicCalendarMatch[]
}

function getDateFromDateString(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(getDateFromDateString(value))
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
  }).format(getDateFromDateString(value))
}

function formatMonth(value: string) {
  const date = getDateFromDateString(value)

  return {
    monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    monthLabel: new Intl.DateTimeFormat('es-ES', {
      month: 'long',
    }).format(date) + ` ${date.getFullYear()}`,
  }
}

function formatTime(value: string | null) {
  if (!value) return 'Hora por confirmar'
  return value.slice(0, 5)
}

export function getClubScore(match: Pick<PublicCalendarMatch, 'isHome' | 'homeScore' | 'awayScore'>) {
  return match.isHome ? match.homeScore : match.awayScore
}

export function getOpponentScore(match: Pick<PublicCalendarMatch, 'isHome' | 'homeScore' | 'awayScore'>) {
  return match.isHome ? match.awayScore : match.homeScore
}

export function getCompetitionLabel(match: Pick<PublicCalendarMatch, 'matchType' | 'roundLabel'>) {
  if (match.matchType === 'friendly') return 'Amistoso'
  return match.roundLabel || 'Jornada por definir'
}

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10)
}

export async function getPublicCalendarData(): Promise<PublicCalendarData> {
  noStore()

  const supabase = createAdminClient()
  const [{ data: seasons }, { data: teams }, { data: categories }, { data: matches }] =
    await Promise.all([
      supabase
        .from('seasons')
        .select('id, name, is_active')
        .order('name', { ascending: false }),
      supabase
        .from('teams')
        .select('id, name, category_id, season_id, is_active')
        .eq('is_active', true),
      supabase.from('categories').select('id, name'),
      supabase
        .from('matches')
        .select('id, team_id, season_id, opponent_name, match_date, match_time, location, is_home, match_type, round_label, status, home_score, away_score')
        .order('match_date', { ascending: false })
        .order('match_time', { ascending: false, nullsFirst: false }),
    ])

  const seasonById = new Map((seasons ?? []).map((season) => [season.id, season.name]))
  const categoryById = new Map((categories ?? []).map((category) => [category.id, category.name]))

  const mappedTeams = (teams ?? [])
    .map((team) => {
      const categoryName = categoryById.get(team.category_id) ?? 'Sin categoría'
      const sortInfo = getTeamCategorySortInfo(team.name, categoryName)

      return {
        id: team.id,
        name: team.name,
        categoryName: sortInfo.label,
        seasonId: team.season_id,
        categoryOrder: sortInfo.order,
        suffixOrder: getTeamSuffixOrder(team.name),
      }
    })
    .sort((a, b) => {
      if (a.categoryOrder !== b.categoryOrder) return a.categoryOrder - b.categoryOrder
      if (a.suffixOrder !== b.suffixOrder) return a.suffixOrder - b.suffixOrder
      return a.name.localeCompare(b.name, 'es')
    })
    .map(({ categoryOrder, suffixOrder, ...team }) => team)

  const teamById = new Map(mappedTeams.map((team) => [team.id, team]))

  return {
    seasons: (seasons ?? []).map((season) => ({
      id: season.id,
      name: season.name,
      isActive: season.is_active,
    })),
    teams: mappedTeams,
    matches: (matches ?? [])
      .filter((match) => teamById.has(match.team_id))
      .map((match) => {
        const team = teamById.get(match.team_id)
        const monthInfo = formatMonth(match.match_date)

        return {
          id: match.id,
          teamId: match.team_id,
          teamName: team?.name ?? CLUB.shortName,
          categoryName: team?.categoryName ?? 'General',
          seasonId: match.season_id,
          seasonName: seasonById.get(match.season_id) ?? CLUB.season,
          opponentName: match.opponent_name,
          matchDate: match.match_date,
          matchTime: match.match_time ?? '',
          dateLabel: formatDate(match.match_date),
          dayLabel: formatDay(match.match_date),
          timeLabel: formatTime(match.match_time),
          monthKey: monthInfo.monthKey,
          monthLabel: monthInfo.monthLabel,
          location: match.location ?? '',
          isHome: Boolean(match.is_home),
          matchType: (match.match_type ?? 'league') as PublicCalendarMatchType,
          roundLabel: match.round_label ?? '',
          status: match.status as PublicCalendarMatchStatus,
          homeScore: match.home_score,
          awayScore: match.away_score,
        }
      }),
  }
}
