import 'server-only'

import { CLUB } from '@/lib/club'
import { formatSpanishDate } from '@/lib/format'
import type { AdminMatchPlayerStat, AdminMatchRow, AdminMatchStatus, AdminMatchType, AdminTeamRow } from '@/lib/admin-app'
import { getTeamCategorySortInfo, getTeamSuffixOrder } from '@/lib/team-order'
import { createAdminClient } from '@/lib/supabase/admin'

function formatMatchTime(value: string | null) {
  if (!value) return 'Hora por confirmar'
  return value.slice(0, 5)
}

function getDateFromDateString(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getMatchWeekInfo(value: string) {
  const date = getDateFromDateString(value)
  const day = date.getDay() || 7
  const monday = new Date(date)
  monday.setDate(date.getDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const thursday = new Date(monday)
  thursday.setDate(monday.getDate() + 3)
  const firstThursday = new Date(thursday.getFullYear(), 0, 4)
  const firstDay = firstThursday.getDay() || 7
  firstThursday.setDate(firstThursday.getDate() - firstDay + 4)
  const weekNumber = 1 + Math.round((thursday.getTime() - firstThursday.getTime()) / 604_800_000)
  const rangeFormatter = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' })

  return {
    weekLabel: `Semana ${weekNumber}`,
    weekRangeLabel: `${rangeFormatter.format(monday)} - ${rangeFormatter.format(sunday)}`,
  }
}

export async function getCoachAssignedTeamIds(userId: string): Promise<string[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('coach_team_assignments')
    .select('team_id')
    .eq('coach_user_id', userId)

  if (error) return []
  return (data ?? []).map((assignment) => assignment.team_id)
}

export async function getCoachTeams(userId: string): Promise<AdminTeamRow[]> {
  const supabase = createAdminClient()
  const teamIds = await getCoachAssignedTeamIds(userId)

  if (teamIds.length === 0) return []

  const [{ data: teams }, { data: categories }, { data: seasons }, { data: athletes }] = await Promise.all([
    supabase
      .from('teams')
      .select('id, name, category_id, season_id, is_active, notes')
      .in('id', teamIds),
    supabase.from('categories').select('id, name'),
    supabase.from('seasons').select('id, name'),
    supabase.from('athletes').select('assigned_team_id').in('assigned_team_id', teamIds),
  ])

  const categoryById = new Map((categories ?? []).map((category) => [category.id, category.name]))
  const seasonById = new Map((seasons ?? []).map((season) => [season.id, season.name]))
  const athleteCountByTeam = new Map<string, number>()

  for (const athlete of athletes ?? []) {
    if (!athlete.assigned_team_id) continue
    athleteCountByTeam.set(
      athlete.assigned_team_id,
      (athleteCountByTeam.get(athlete.assigned_team_id) ?? 0) + 1,
    )
  }

  type CoachTeamSortRow = AdminTeamRow & {
    categoryOrder: number
    suffixOrder: number
  }

  return (teams ?? [])
    .map((team) => {
      const total = athleteCountByTeam.get(team.id) ?? 0
      const categoryName = categoryById.get(team.category_id) ?? 'Sin categoría'
      const sortInfo = getTeamCategorySortInfo(team.name, categoryName)

      return {
        id: team.id,
        nombre: team.name,
        categoria: sortInfo.label,
        categoryId: team.category_id,
        temporada: seasonById.get(team.season_id) ?? CLUB.season,
        seasonId: team.season_id,
        deportistas: total,
        isActive: team.is_active,
        notes: team.notes ?? null,
        estado: !team.is_active ? 'Pendiente' : total >= 15 ? 'Completo' : 'Abierto',
        categoryOrder: sortInfo.order,
        suffixOrder: getTeamSuffixOrder(team.name),
      } as CoachTeamSortRow
    })
    .sort((a, b) => {
      if (a.categoryOrder !== b.categoryOrder) return a.categoryOrder - b.categoryOrder
      if (a.suffixOrder !== b.suffixOrder) return a.suffixOrder - b.suffixOrder
      return a.nombre.localeCompare(b.nombre, 'es')
    })
    .map(({ categoryOrder, suffixOrder, ...team }) => team)
}

export async function getCoachMatches(userId: string): Promise<AdminMatchRow[]> {
  const supabase = createAdminClient()
  const teamIds = await getCoachAssignedTeamIds(userId)

  if (teamIds.length === 0) return []

  const matchSelect =
    'id, team_id, season_id, opponent_name, match_date, match_time, location, is_home, match_type, round_label, status, home_score, away_score, home_possession, away_possession, home_offsides, away_offsides, home_corners, away_corners, home_total_shots, away_total_shots, home_shots, away_shots, home_shots_on_target, away_shots_on_target, home_blocked_shots, away_blocked_shots, home_goalkeeper_saves, away_goalkeeper_saves, home_tackles, away_tackles, home_passes, away_passes, home_completed_passes, away_completed_passes, home_fouls, away_fouls, home_yellow_cards, away_yellow_cards, home_red_cards, away_red_cards, notes'
  const fallbackMatchSelect =
    'id, team_id, season_id, opponent_name, match_date, match_time, location, is_home, match_type, round_label, status, home_score, away_score, notes'
  const [{ data: matchesWithStats, error: matchesError }, { data: teams }, { data: categories }, { data: seasons }] = await Promise.all([
    supabase
      .from('matches')
      .select(matchSelect)
      .in('team_id', teamIds)
      .order('match_date', { ascending: false })
      .order('match_time', { ascending: false, nullsFirst: false }),
    supabase.from('teams').select('id, name, category_id, season_id').in('id', teamIds),
    supabase.from('categories').select('id, name'),
    supabase.from('seasons').select('id, name'),
  ])

  const matches = matchesError
    ? (await supabase
        .from('matches')
        .select(fallbackMatchSelect)
        .in('team_id', teamIds)
        .order('match_date', { ascending: false })
        .order('match_time', { ascending: false, nullsFirst: false })).data
    : matchesWithStats

  const matchIds = (matches ?? []).map((match) => match.id)
  const [{ data: athletes }, { data: savedPlayerStats, error: playerStatsError }] = await Promise.all([
    supabase
      .from('athletes')
      .select('id, first_name, last_name, assigned_team_id, position, status')
      .in('assigned_team_id', teamIds)
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true }),
    matchIds.length > 0
      ? supabase
          .from('match_player_stats')
          .select('match_id, athlete_id, position, is_called_up, is_starter, shirt_number, minutes, goals, goal_minutes, assists, fouls_committed, fouls_received, yellow_cards, yellow_card_minutes, red_cards, red_card_minute, shots, saves, notes')
          .in('match_id', matchIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const teamById = new Map((teams ?? []).map((team) => [team.id, team]))
  const categoryById = new Map((categories ?? []).map((category) => [category.id, category.name]))
  const seasonById = new Map((seasons ?? []).map((season) => [season.id, season.name]))
  const athletesByTeamId = new Map<string, NonNullable<typeof athletes>>()
  const playerStatsByMatchAndAthlete = new Map<string, NonNullable<typeof savedPlayerStats>[number]>()

  for (const athlete of athletes ?? []) {
    if (!athlete.assigned_team_id) continue
    const current = athletesByTeamId.get(athlete.assigned_team_id) ?? []
    current.push(athlete)
    athletesByTeamId.set(athlete.assigned_team_id, current)
  }

  if (!playerStatsError) {
    for (const stat of savedPlayerStats ?? []) {
      playerStatsByMatchAndAthlete.set(`${stat.match_id}:${stat.athlete_id}`, stat)
    }
  }

  return (matches ?? []).map((match) => {
    const stats = match as typeof match & Record<string, number | null | undefined>
    const team = teamById.get(match.team_id)
    const categoryName = team ? categoryById.get(team.category_id) ?? 'Sin categoría' : 'Sin categoría'
    const sortInfo = getTeamCategorySortInfo(team?.name ?? '', categoryName)
    const weekInfo = getMatchWeekInfo(match.match_date)
    const playerStats: AdminMatchPlayerStat[] = (athletesByTeamId.get(match.team_id) ?? []).map((athlete) => {
      const saved = playerStatsByMatchAndAthlete.get(`${match.id}:${athlete.id}`)

      return {
        athleteId: athlete.id,
        athleteName: `${athlete.first_name} ${athlete.last_name}`.trim(),
        position: (saved?.position ?? athlete.position ?? null) as AdminMatchPlayerStat['position'],
        isCalledUp: saved?.is_called_up ?? false,
        isStarter: saved?.is_starter ?? false,
        shirtNumber: saved?.shirt_number ?? null,
        minutes: saved?.minutes ?? 0,
        goals: saved?.goals ?? 0,
        goalMinutes: saved?.goal_minutes ?? '',
        assists: saved?.assists ?? 0,
        foulsCommitted: saved?.fouls_committed ?? 0,
        foulsReceived: saved?.fouls_received ?? 0,
        yellowCards: saved?.yellow_cards ?? 0,
        yellowCardMinutes: saved?.yellow_card_minutes ?? '',
        redCards: saved?.red_cards ?? 0,
        redCardMinute: saved?.red_card_minute ?? null,
        shots: saved?.shots ?? 0,
        saves: saved?.saves ?? 0,
        notes: saved?.notes ?? '',
      }
    })

    return {
      id: match.id,
      teamId: match.team_id,
      teamName: team?.name ?? 'Equipo no disponible',
      categoryName: sortInfo.label,
      seasonId: match.season_id,
      seasonName: seasonById.get(match.season_id) ?? 'Temporada no disponible',
      opponentName: match.opponent_name,
      matchDate: match.match_date,
      matchTime: match.match_time ?? '',
      dateLabel: formatSpanishDate(match.match_date),
      timeLabel: formatMatchTime(match.match_time),
      weekLabel: weekInfo.weekLabel,
      weekRangeLabel: weekInfo.weekRangeLabel,
      location: match.location ?? '',
      isHome: Boolean(match.is_home),
      matchType: (match.match_type ?? 'league') as AdminMatchType,
      roundLabel: match.round_label ?? '',
      status: match.status as AdminMatchStatus,
      homeScore: match.home_score,
      awayScore: match.away_score,
      homePossession: stats.home_possession ?? null,
      awayPossession: stats.away_possession ?? null,
      homeOffsides: stats.home_offsides ?? null,
      awayOffsides: stats.away_offsides ?? null,
      homeCorners: stats.home_corners ?? null,
      awayCorners: stats.away_corners ?? null,
      homeTotalShots: stats.home_total_shots ?? null,
      awayTotalShots: stats.away_total_shots ?? null,
      homeShots: stats.home_shots ?? null,
      awayShots: stats.away_shots ?? null,
      homeShotsOnTarget: stats.home_shots_on_target ?? null,
      awayShotsOnTarget: stats.away_shots_on_target ?? null,
      homeBlockedShots: stats.home_blocked_shots ?? null,
      awayBlockedShots: stats.away_blocked_shots ?? null,
      homeGoalkeeperSaves: stats.home_goalkeeper_saves ?? null,
      awayGoalkeeperSaves: stats.away_goalkeeper_saves ?? null,
      homeTackles: stats.home_tackles ?? null,
      awayTackles: stats.away_tackles ?? null,
      homePasses: stats.home_passes ?? null,
      awayPasses: stats.away_passes ?? null,
      homeCompletedPasses: stats.home_completed_passes ?? null,
      awayCompletedPasses: stats.away_completed_passes ?? null,
      homeFouls: stats.home_fouls ?? null,
      awayFouls: stats.away_fouls ?? null,
      homeYellowCards: stats.home_yellow_cards ?? null,
      awayYellowCards: stats.away_yellow_cards ?? null,
      homeRedCards: stats.home_red_cards ?? null,
      awayRedCards: stats.away_red_cards ?? null,
      notes: match.notes ?? '',
      playerStats,
    }
  })
}
