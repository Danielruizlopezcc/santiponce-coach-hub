'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireCoachAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createTrainingSession,
  createTrainingSessions,
  deleteTrainingSeries,
  deleteTrainingSession,
  listTrainingSessions,
  updateTrainingSession,
} from '@/lib/training-sessions'

const matchStatusSchema = z.enum(['scheduled', 'played', 'postponed', 'cancelled'])
const matchTypeSchema = z.enum(['league', 'friendly'])
const trainingLocationSchema = z.enum(['Campo 1', 'Campo 2', 'Campo completo', 'Anexo'])
const trainingAttendanceStatusSchema = z.enum(['attended', 'justified_absence', 'unjustified_absence', 'late'])

const playerStatSchema = z.object({
  athleteId: z.string().uuid(),
  position: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward']).nullable(),
  isCalledUp: z.boolean(),
  isStarter: z.boolean(),
  shirtNumber: z.number().int().min(0).max(99).nullable(),
  minutes: z.number().int().min(0).max(100),
  goals: z.number().int().min(0),
  goalMinutes: z.string().trim().max(80).optional(),
  assists: z.number().int().min(0),
  foulsCommitted: z.number().int().min(0),
  foulsReceived: z.number().int().min(0),
  yellowCards: z.number().int().min(0).max(2),
  yellowCardMinutes: z.string().trim().max(40).optional(),
  redCards: z.number().int().min(0).max(1),
  redCardMinute: z.number().int().min(1).max(100).nullable(),
  shots: z.number().int().min(0),
  saves: z.number().int().min(0),
  notes: z.string().trim().max(300).optional(),
}).refine((value) => !value.isStarter || value.isCalledUp, {
  message: 'Un titular debe estar convocado.',
  path: ['isStarter'],
})

function parseMinuteList(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return []

  return trimmed
    .split(',')
    .map((minute) => minute.trim())
    .filter(Boolean)
    .map(Number)
}

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
  playerStats: z.array(playerStatSchema).optional(),
})

function validatePlayerStats(playerStats: z.infer<typeof playerStatSchema>[] | undefined, ctx: z.RefinementCtx) {
  const shirtNumbers = new Map<number, string>()

  for (const stat of playerStats ?? []) {
    if (!stat.isCalledUp) continue

    if (stat.yellowCards === 2 && stat.redCards < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Un jugador con 2 amarillas debe tener 1 roja.',
        path: ['playerStats'],
      })
    }

    const goalMinutes = parseMinuteList(stat.goalMinutes)
    const yellowCardMinutes = parseMinuteList(stat.yellowCardMinutes)

    if ([...goalMinutes, ...yellowCardMinutes].some((minute) => !Number.isInteger(minute) || minute < 1 || minute > 100)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Los minutos de goles y tarjetas deben estar entre 1 y 100.',
        path: ['playerStats'],
      })
    }

    if (goalMinutes.length !== stat.goals) {
      ctx.addIssue({
        code: 'custom',
        message: 'Debe haber un minuto por cada gol del jugador.',
        path: ['playerStats'],
      })
    }

    if (yellowCardMinutes.length !== stat.yellowCards) {
      ctx.addIssue({
        code: 'custom',
        message: 'Debe haber un minuto por cada amarilla del jugador.',
        path: ['playerStats'],
      })
    }

    if ((stat.redCards > 0 || stat.yellowCards >= 2) && stat.redCardMinute === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Debe indicarse el minuto de la tarjeta roja.',
        path: ['playerStats'],
      })
    }

    if (stat.position !== 'goalkeeper' && stat.saves > 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Solo puedes asignar paradas a un portero.',
        path: ['playerStats'],
      })
    }

    if (stat.shirtNumber === null) continue

    if (shirtNumbers.has(stat.shirtNumber)) {
      ctx.addIssue({
        code: 'custom',
        message: `Hay más de un jugador con el dorsal ${stat.shirtNumber}.`,
        path: ['playerStats'],
      })
    }

    shirtNumbers.set(stat.shirtNumber, stat.athleteId)
  }
}

function validateMatchStats(value: z.infer<typeof matchBaseSchema>, ctx: z.RefinementCtx) {
  const homePossession = value.homePossession ?? null
  const awayPossession = value.awayPossession ?? null
  const hasPossession = homePossession !== null || awayPossession !== null

  if (hasPossession) {
    if (homePossession === null || awayPossession === null || homePossession + awayPossession !== 100) {
      ctx.addIssue({
        code: 'custom',
        message: 'La posesión de ambos equipos debe sumar exactamente 100.',
        path: ['homePossession'],
      })
    }
  }

  const homeAutoTotalShots =
    (value.homeShots ?? 0) + (value.homeShotsOnTarget ?? 0) + (value.homeBlockedShots ?? 0)
  const awayAutoTotalShots =
    (value.awayShots ?? 0) + (value.awayShotsOnTarget ?? 0) + (value.awayBlockedShots ?? 0)

  if (value.homeTotalShots !== undefined && value.homeTotalShots !== null && value.homeTotalShots !== homeAutoTotalShots) {
    ctx.addIssue({
      code: 'custom',
      message: 'Los disparos totales del equipo local deben coincidir con la suma de tiros, tiros a puerta y bloqueados.',
      path: ['homeTotalShots'],
    })
  }

  if (value.awayTotalShots !== undefined && value.awayTotalShots !== null && value.awayTotalShots !== awayAutoTotalShots) {
    ctx.addIssue({
      code: 'custom',
      message: 'Los disparos totales del equipo visitante deben coincidir con la suma de tiros, tiros a puerta y bloqueados.',
      path: ['awayTotalShots'],
    })
  }

  validatePlayerStats(value.playerStats, ctx)
}

const matchSchema = matchBaseSchema
  .superRefine(validateMatchStats)
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

const createMatchSchema = matchBaseSchema.omit({ id: true }).superRefine(validateMatchStats)
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

const trainingBaseSchema = z.object({
  id: z.string().uuid().optional(),
  teamId: z.string().uuid('Selecciona un equipo.'),
  trainingDate: z.string().min(1, 'Introduce la fecha del entrenamiento.'),
  startTime: z.string().min(1, 'Introduce la hora del entrenamiento.'),
  durationHours: z.number().int().min(0).max(6),
  durationMinutes: z.number().int().min(0).max(59),
  location: trainingLocationSchema,
  notes: z.string().trim().max(300, 'Las notas son demasiado largas.').optional(),
})

const createTrainingSchema = trainingBaseSchema.omit({ id: true }).refine((value) => value.durationHours > 0 || value.durationMinutes > 0, {
  message: 'Introduce una duración mayor que cero.',
  path: ['durationHours'],
})
const createRecurringTrainingSchema = createTrainingSchema.extend({
  repeatMonths: z.number().int().min(1, 'Indica al menos 1 mes.').max(12, 'El máximo permitido es 12 meses.'),
})
const updateTrainingSchema = trainingBaseSchema.required({ id: true }).refine((value) => value.durationHours > 0 || value.durationMinutes > 0, {
  message: 'Introduce una duración mayor que cero.',
  path: ['durationHours'],
})
const trainingAttendanceSchema = z.object({
  trainingId: z.string().uuid(),
  attendance: z.array(z.object({
    athleteId: z.string().uuid(),
    status: trainingAttendanceStatusSchema,
  })),
})

type TrainingInput = z.infer<typeof trainingBaseSchema>
type TrainingAttendanceInput = z.infer<typeof trainingAttendanceSchema>
function revalidateCoachCalendarPaths() {
  revalidatePath('/entrenador')
  revalidatePath('/entrenador/calendario')
  revalidatePath('/entrenador/partidos')
  revalidatePath('/entrenador/entrenamientos')
  revalidatePath('/calendario')
  revalidatePath('/admin/calendario')
  revalidatePath('/admin')
}

function toTrainingPayload(parsed: TrainingInput, seasonId: string) {
  return {
    teamId: parsed.teamId,
    seasonId,
    trainingDate: parsed.trainingDate,
    startTime: parsed.startTime,
    durationMinutes: parsed.durationHours * 60 + parsed.durationMinutes,
    location: parsed.location,
    notes: parsed.notes?.trim() || '',
  }
}

function getWeeklyTrainingDates(startDate: string, repeatMonths: number) {
  const [year, month, day] = startDate.split('-').map(Number)
  const start = new Date(year, month - 1, day)
  const end = new Date(start)
  end.setMonth(end.getMonth() + repeatMonths)

  const dates: string[] = []
  const current = new Date(start)
  while (current < end) {
    const yyyy = current.getFullYear()
    const mm = String(current.getMonth() + 1).padStart(2, '0')
    const dd = String(current.getDate()).padStart(2, '0')
    dates.push(`${yyyy}-${mm}-${dd}`)
    current.setDate(current.getDate() + 7)
  }

  return dates
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

async function assertCoachCanUseTraining(coachUserId: string, trainingId: string) {
  const trainings = await listTrainingSessions(createAdminClient())
  const training = trainings.find((item) => item.id === trainingId)
  if (!training) throw new Error('No se ha encontrado el entrenamiento.')
  await assertCoachCanUseTeam(coachUserId, training.teamId)
}

async function assertCoachCanUseTrainingSeries(coachUserId: string, seriesId: string) {
  const trainings = await listTrainingSessions(createAdminClient())
  const seriesTrainings = trainings.filter((item) => item.seriesId === seriesId)
  if (seriesTrainings.length === 0) throw new Error('No se ha encontrado la serie de entrenamientos.')

  for (const training of seriesTrainings) {
    await assertCoachCanUseTeam(coachUserId, training.teamId)
  }
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

async function saveMatchPlayerStats(matchId: string, teamId: string, seasonId: string, playerStats: z.infer<typeof playerStatSchema>[]) {
  const supabase = createAdminClient()
  const athleteIds = playerStats.map((stat) => stat.athleteId)

  if (athleteIds.length === 0) return

  const { data: athletes, error: athletesError } = await supabase
    .from('athletes')
    .select('id, assigned_team_id')
    .in('id', athleteIds)

  if (athletesError) throw new Error(athletesError.message)

  const validAthleteIds = new Set(
    (athletes ?? [])
      .filter((athlete) => athlete.assigned_team_id === teamId)
      .map((athlete) => athlete.id),
  )

  if (validAthleteIds.size !== athleteIds.length) {
    throw new Error('Solo puedes guardar estadísticas de jugadores de ese equipo.')
  }

  const rows = playerStats.map((stat) => ({
    match_id: matchId,
    team_id: teamId,
    season_id: seasonId,
    athlete_id: stat.athleteId,
    is_called_up: stat.isCalledUp,
    is_starter: stat.isCalledUp ? stat.isStarter : false,
    position: stat.isCalledUp ? stat.position : null,
    shirt_number: stat.isCalledUp ? stat.shirtNumber : null,
    minutes: stat.isCalledUp ? stat.minutes : 0,
    goals: stat.isCalledUp ? stat.goals : 0,
    goal_minutes: stat.isCalledUp ? stat.goalMinutes?.trim() || null : null,
    assists: stat.isCalledUp ? stat.assists : 0,
    fouls_committed: stat.isCalledUp ? stat.foulsCommitted : 0,
    fouls_received: stat.isCalledUp ? stat.foulsReceived : 0,
    yellow_cards: stat.isCalledUp ? stat.yellowCards : 0,
    yellow_card_minutes: stat.isCalledUp ? stat.yellowCardMinutes?.trim() || null : null,
    red_cards: stat.isCalledUp ? (stat.redCards || stat.yellowCards >= 2 ? 1 : 0) : 0,
    red_card_minute: stat.isCalledUp && (stat.redCards || stat.yellowCards >= 2) ? stat.redCardMinute : null,
    shots: stat.isCalledUp ? stat.shots : 0,
    saves: stat.isCalledUp && stat.position === 'goalkeeper' ? stat.saves : 0,
    notes: stat.isCalledUp ? stat.notes?.trim() || null : null,
  }))

  const { error } = await supabase
    .from('match_player_stats')
    .upsert(rows, { onConflict: 'match_id,athlete_id' })

  if (error) throw new Error(error.message)
}

async function saveTrainingAttendance(input: TrainingAttendanceInput) {
  const supabase = createAdminClient()
  const trainings = await listTrainingSessions(supabase)
  const training = trainings.find((item) => item.id === input.trainingId)

  if (!training) throw new Error('No se ha encontrado el entrenamiento.')

  const athleteIds = input.attendance.map((row) => row.athleteId)
  const uniqueAthleteIds = new Set(athleteIds)

  if (uniqueAthleteIds.size !== athleteIds.length) {
    throw new Error('Hay jugadores duplicados en la ficha de asistencia.')
  }

  const { data: athletes, error: athletesError } = athleteIds.length > 0
    ? await supabase
        .from('athletes')
        .select('id, assigned_team_id')
        .in('id', athleteIds)
    : { data: [], error: null }

  if (athletesError) throw new Error(athletesError.message)

  const validAthleteIds = new Set(
    (athletes ?? [])
      .filter((athlete) => athlete.assigned_team_id === training.teamId)
      .map((athlete) => athlete.id),
  )

  if (validAthleteIds.size !== uniqueAthleteIds.size) {
    throw new Error('Solo puedes guardar asistencia de jugadores de ese equipo.')
  }

  const { error: trainingUpsertError } = await supabase
    .from('training_sessions')
    .upsert(
      {
        id: training.id,
        team_id: training.teamId,
        season_id: training.seasonId,
        training_date: training.trainingDate,
        start_time: training.startTime,
        duration_minutes: training.durationMinutes,
        location: training.location,
        notes: training.notes || null,
        series_id: training.seriesId ?? null,
      },
      { onConflict: 'id' },
    )

  if (trainingUpsertError) throw new Error(trainingUpsertError.message)

  const { error: deleteError } = await supabase
    .from('training_attendance')
    .delete()
    .eq('training_session_id', training.id)

  if (deleteError) throw new Error(deleteError.message)
  if (input.attendance.length === 0) return

  const { error } = await supabase
    .from('training_attendance')
    .upsert(
      input.attendance.map((row) => ({
        training_session_id: training.id,
        team_id: training.teamId,
        season_id: training.seasonId,
        athlete_id: row.athleteId,
        status: row.status,
      })),
      { onConflict: 'training_session_id,athlete_id' },
    )

  if (error) throw new Error(error.message)
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

export async function createCoachTrainingAction(input: TrainingInput): Promise<void> {
  const coach = await requireCoachAction()
  const parsed = createTrainingSchema.parse(input)
  await assertCoachCanUseTeam(coach.id, parsed.teamId)
  const seasonId = await getTeamSeasonId(parsed.teamId)

  await createTrainingSession(createAdminClient(), toTrainingPayload(parsed, seasonId))
  revalidateCoachCalendarPaths()
}

export async function createCoachRecurringTrainingAction(input: TrainingInput & { repeatMonths: number }): Promise<void> {
  const coach = await requireCoachAction()
  const parsed = createRecurringTrainingSchema.parse(input)
  await assertCoachCanUseTeam(coach.id, parsed.teamId)
  const seasonId = await getTeamSeasonId(parsed.teamId)
  const seriesId = crypto.randomUUID()
  const dates = getWeeklyTrainingDates(parsed.trainingDate, parsed.repeatMonths)

  await createTrainingSessions(
    createAdminClient(),
    dates.map((trainingDate) => ({
      seriesId,
      ...toTrainingPayload({ ...parsed, trainingDate }, seasonId),
    })),
  )
  revalidateCoachCalendarPaths()
}

export async function updateCoachTrainingAction(input: TrainingInput & { id: string }): Promise<void> {
  const coach = await requireCoachAction()
  const parsed = updateTrainingSchema.parse(input)
  await assertCoachCanUseTraining(coach.id, parsed.id)
  await assertCoachCanUseTeam(coach.id, parsed.teamId)
  const seasonId = await getTeamSeasonId(parsed.teamId)
  const supabase = createAdminClient()
  const trainings = await listTrainingSessions(supabase)
  const currentTraining = trainings.find((training) => training.id === parsed.id)

  await updateTrainingSession(supabase, {
    id: parsed.id,
    seriesId: currentTraining?.seriesId,
    ...toTrainingPayload(parsed, seasonId),
  })
  revalidateCoachCalendarPaths()
}

export async function deleteCoachTrainingAction(id: string): Promise<void> {
  const coach = await requireCoachAction()
  const parsedId = z.string().uuid().parse(id)
  await assertCoachCanUseTraining(coach.id, parsedId)

  await deleteTrainingSession(createAdminClient(), parsedId)
  revalidateCoachCalendarPaths()
}

export async function deleteCoachTrainingSeriesAction(seriesId: string): Promise<void> {
  const coach = await requireCoachAction()
  const parsedSeriesId = z.string().uuid().parse(seriesId)
  await assertCoachCanUseTrainingSeries(coach.id, parsedSeriesId)

  await deleteTrainingSeries(createAdminClient(), parsedSeriesId)
  revalidateCoachCalendarPaths()
}

export async function updateCoachTrainingAttendanceAction(input: TrainingAttendanceInput): Promise<void> {
  const coach = await requireCoachAction()
  const parsed = trainingAttendanceSchema.parse(input)
  const trainings = await listTrainingSessions(createAdminClient())
  const training = trainings.find((item) => item.id === parsed.trainingId)

  if (!training) throw new Error('No se ha encontrado el entrenamiento.')
  await assertCoachCanUseTeam(coach.id, training.teamId)
  await saveTrainingAttendance(parsed)
  revalidateCoachCalendarPaths()
  revalidatePath('/entrenador/estadisticas')
  revalidatePath('/admin/estadisticas')
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
  if (parsed.playerStats) {
    await saveMatchPlayerStats(parsed.id, parsed.teamId, seasonId, parsed.playerStats)
  }
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
