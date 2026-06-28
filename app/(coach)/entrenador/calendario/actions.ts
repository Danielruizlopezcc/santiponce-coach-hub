'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireCoachAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const matchStatusSchema = z.enum(['scheduled', 'played', 'postponed', 'cancelled'])
const matchTypeSchema = z.enum(['league', 'friendly'])

const matchBaseSchema = z.object({
  id: z.string().uuid().optional(),
  teamId: z.string().uuid('Selecciona un equipo.'),
  opponentName: z.string().trim().min(2, 'Introduce el rival.').max(80, 'El rival es demasiado largo.'),
  matchDate: z.string().min(1, 'Introduce la fecha del partido.'),
  matchTime: z.string().optional(),
  location: z.string().trim().max(120, 'El lugar es demasiado largo.').optional(),
  isHome: z.boolean(),
  matchType: matchTypeSchema,
  roundLabel: z.string().trim().max(40, 'La jornada es demasiado larga.').optional(),
  status: matchStatusSchema,
  homeScore: z.number().int().min(0).nullable(),
  awayScore: z.number().int().min(0).nullable(),
  homePossession: z.number().int().min(0).max(100).nullable().optional(),
  awayPossession: z.number().int().min(0).max(100).nullable().optional(),
  homeOffsides: z.number().int().min(0).nullable().optional(),
  awayOffsides: z.number().int().min(0).nullable().optional(),
  homeCorners: z.number().int().min(0).nullable().optional(),
  awayCorners: z.number().int().min(0).nullable().optional(),
  homeTotalShots: z.number().int().min(0).nullable().optional(),
  awayTotalShots: z.number().int().min(0).nullable().optional(),
  homeShots: z.number().int().min(0).nullable().optional(),
  awayShots: z.number().int().min(0).nullable().optional(),
  homeShotsOnTarget: z.number().int().min(0).nullable().optional(),
  awayShotsOnTarget: z.number().int().min(0).nullable().optional(),
  homeBlockedShots: z.number().int().min(0).nullable().optional(),
  awayBlockedShots: z.number().int().min(0).nullable().optional(),
  homeGoalkeeperSaves: z.number().int().min(0).nullable().optional(),
  awayGoalkeeperSaves: z.number().int().min(0).nullable().optional(),
  homeTackles: z.number().int().min(0).nullable().optional(),
  awayTackles: z.number().int().min(0).nullable().optional(),
  homePasses: z.number().int().min(0).nullable().optional(),
  awayPasses: z.number().int().min(0).nullable().optional(),
  homeCompletedPasses: z.number().int().min(0).nullable().optional(),
  awayCompletedPasses: z.number().int().min(0).nullable().optional(),
  homeFouls: z.number().int().min(0).nullable().optional(),
  awayFouls: z.number().int().min(0).nullable().optional(),
  homeYellowCards: z.number().int().min(0).nullable().optional(),
  awayYellowCards: z.number().int().min(0).nullable().optional(),
  homeRedCards: z.number().int().min(0).nullable().optional(),
  awayRedCards: z.number().int().min(0).nullable().optional(),
  notes: z.string().trim().max(500, 'Las notas son demasiado largas.').optional(),
})

const matchSchema = matchBaseSchema
  .refine(
    (value) => value.status !== 'played' || (value.homeScore !== null && value.awayScore !== null),
    {
      message: 'Introduce el resultado para marcar el partido como jugado.',
      path: ['homeScore'],
    },
  )
  .refine(
    (value) => value.matchType !== 'league' || Boolean(value.roundLabel?.trim()),
    {
      message: 'Introduce la jornada de liga.',
      path: ['roundLabel'],
    },
  )

const createMatchSchema = matchBaseSchema.omit({ id: true })
  .refine(
    (value) => value.status !== 'played' || (value.homeScore !== null && value.awayScore !== null),
    {
      message: 'Introduce el resultado para marcar el partido como jugado.',
      path: ['homeScore'],
    },
  )
  .refine(
    (value) => value.matchType !== 'league' || Boolean(value.roundLabel?.trim()),
    {
      message: 'Introduce la jornada de liga.',
      path: ['roundLabel'],
    },
  )

type MatchInput = z.infer<typeof matchSchema>

function revalidateCoachCalendarPaths() {
  revalidatePath('/entrenador')
  revalidatePath('/entrenador/calendario')
  revalidatePath('/calendario')
  revalidatePath('/admin/calendario')
  revalidatePath('/admin')
}

async function assertCoachCanUseTeam(coachUserId: string, teamId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('coach_team_assignments')
    .select('team_id')
    .eq('coach_user_id', coachUserId)
    .eq('team_id', teamId)
    .maybeSingle()

  if (error || !data) {
    throw new Error('No tienes permiso para gestionar partidos de ese equipo.')
  }
}

async function assertCoachCanUseMatch(coachUserId: string, matchId: string) {
  const supabase = createAdminClient()
  const { data: match, error } = await supabase
    .from('matches')
    .select('id, team_id')
    .eq('id', matchId)
    .maybeSingle()

  if (error || !match) {
    throw new Error('No se ha encontrado el partido.')
  }

  await assertCoachCanUseTeam(coachUserId, match.team_id)
}

async function getTeamSeasonId(teamId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('teams')
    .select('season_id')
    .eq('id', teamId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('No se ha encontrado el equipo seleccionado.')

  return data.season_id
}

function toMatchPayload(parsed: MatchInput, seasonId: string) {
  const isPlayed = parsed.status === 'played'
  const isLeague = parsed.matchType === 'league'

  const payload: Record<string, string | number | boolean | null> = {
    team_id: parsed.teamId,
    season_id: seasonId,
    opponent_name: parsed.opponentName,
    match_date: parsed.matchDate,
    match_time: parsed.matchTime || null,
    location: parsed.location || null,
    is_home: parsed.isHome,
    match_type: parsed.matchType,
    round_label: isLeague ? parsed.roundLabel?.trim() ?? null : null,
    status: parsed.status,
    home_score: isPlayed ? parsed.homeScore : null,
    away_score: isPlayed ? parsed.awayScore : null,
    notes: parsed.notes || null,
  }

  if (parsed.homeFouls !== undefined) payload.home_fouls = parsed.homeFouls
  if (parsed.awayFouls !== undefined) payload.away_fouls = parsed.awayFouls
  if (parsed.homeYellowCards !== undefined) payload.home_yellow_cards = parsed.homeYellowCards
  if (parsed.awayYellowCards !== undefined) payload.away_yellow_cards = parsed.awayYellowCards
  if (parsed.homeRedCards !== undefined) payload.home_red_cards = parsed.homeRedCards
  if (parsed.awayRedCards !== undefined) payload.away_red_cards = parsed.awayRedCards
  if (parsed.homePossession !== undefined) payload.home_possession = parsed.homePossession
  if (parsed.awayPossession !== undefined) payload.away_possession = parsed.awayPossession
  if (parsed.homeOffsides !== undefined) payload.home_offsides = parsed.homeOffsides
  if (parsed.awayOffsides !== undefined) payload.away_offsides = parsed.awayOffsides
  if (parsed.homeCorners !== undefined) payload.home_corners = parsed.homeCorners
  if (parsed.awayCorners !== undefined) payload.away_corners = parsed.awayCorners
  if (parsed.homeTotalShots !== undefined) payload.home_total_shots = parsed.homeTotalShots
  if (parsed.awayTotalShots !== undefined) payload.away_total_shots = parsed.awayTotalShots
  if (parsed.homeShots !== undefined) payload.home_shots = parsed.homeShots
  if (parsed.awayShots !== undefined) payload.away_shots = parsed.awayShots
  if (parsed.homeShotsOnTarget !== undefined) payload.home_shots_on_target = parsed.homeShotsOnTarget
  if (parsed.awayShotsOnTarget !== undefined) payload.away_shots_on_target = parsed.awayShotsOnTarget
  if (parsed.homeBlockedShots !== undefined) payload.home_blocked_shots = parsed.homeBlockedShots
  if (parsed.awayBlockedShots !== undefined) payload.away_blocked_shots = parsed.awayBlockedShots
  if (parsed.homeGoalkeeperSaves !== undefined) payload.home_goalkeeper_saves = parsed.homeGoalkeeperSaves
  if (parsed.awayGoalkeeperSaves !== undefined) payload.away_goalkeeper_saves = parsed.awayGoalkeeperSaves
  if (parsed.homeTackles !== undefined) payload.home_tackles = parsed.homeTackles
  if (parsed.awayTackles !== undefined) payload.away_tackles = parsed.awayTackles
  if (parsed.homePasses !== undefined) payload.home_passes = parsed.homePasses
  if (parsed.awayPasses !== undefined) payload.away_passes = parsed.awayPasses
  if (parsed.homeCompletedPasses !== undefined) payload.home_completed_passes = parsed.homeCompletedPasses
  if (parsed.awayCompletedPasses !== undefined) payload.away_completed_passes = parsed.awayCompletedPasses

  return payload
}

export async function createCoachMatchAction(input: MatchInput): Promise<void> {
  const coach = await requireCoachAction()
  const parsed = createMatchSchema.parse(input)
  await assertCoachCanUseTeam(coach.id, parsed.teamId)
  const seasonId = await getTeamSeasonId(parsed.teamId)
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('matches')
    .insert(toMatchPayload(parsed, seasonId))

  if (error) throw new Error(error.message)
  revalidateCoachCalendarPaths()
}

export async function updateCoachMatchAction(input: MatchInput & { id: string }): Promise<void> {
  const coach = await requireCoachAction()
  const parsed = matchSchema.required({ id: true }).parse(input)
  await assertCoachCanUseMatch(coach.id, parsed.id)
  await assertCoachCanUseTeam(coach.id, parsed.teamId)
  const seasonId = await getTeamSeasonId(parsed.teamId)
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('matches')
    .update(toMatchPayload(parsed, seasonId))
    .eq('id', parsed.id)

  if (error) throw new Error(error.message)
  revalidateCoachCalendarPaths()
}

export async function deleteCoachMatchAction(id: string): Promise<void> {
  const coach = await requireCoachAction()
  const parsedId = z.string().uuid().parse(id)
  await assertCoachCanUseMatch(coach.id, parsedId)
  const supabase = createAdminClient()
  const { error } = await supabase.from('matches').delete().eq('id', parsedId)

  if (error) throw new Error(error.message)
  revalidateCoachCalendarPaths()
}
