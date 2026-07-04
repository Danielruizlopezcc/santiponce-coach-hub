'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireSportsAdminAction } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const matchStatusSchema = z.enum(['scheduled', 'played', 'postponed', 'cancelled'])
const matchTypeSchema = z.enum(['league', 'friendly'])
const fieldLocationSchema = z.enum(['Campo 1', 'Campo 2', 'Campo completo', 'Anexo'])
const trainingLocationSchema = fieldLocationSchema

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
  durationHours: z.number().int().min(0).max(6),
  durationMinutes: z.number().int().min(0).max(59),
  location: fieldLocationSchema,
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

const createMatchSchema = matchBaseSchema
  .omit({ id: true })
  .superRefine(validateMatchStats)
  .refine((value) => value.durationHours > 0 || value.durationMinutes > 0, {
    message: 'Introduce una duración mayor que cero.',
    path: ['durationHours'],
  })
  .refine(
    (value) => value.status !== 'played' || (value.homeScore !== null && value.awayScore !== null),
    {
      message: 'Introduce el resultado para marcar el partido como jugado.',
      path: ['homeScore'],
    },
  )

const updateMatchSchema = matchBaseSchema
  .required({ id: true })
  .superRefine(validateMatchStats)
  .refine((value) => value.durationHours > 0 || value.durationMinutes > 0, {
    message: 'Introduce una duración mayor que cero.',
    path: ['durationHours'],
  })
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
  .refine(
    (value) => value.matchType !== 'league' || Boolean(value.roundLabel?.trim()),
    {
      message: 'Introduce la jornada de liga.',
      path: ['roundLabel'],
    },
  )

type MatchInput = z.infer<typeof matchBaseSchema>

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
const updateTrainingSchema = trainingBaseSchema.required({ id: true }).refine((value) => value.durationHours > 0 || value.durationMinutes > 0, {
  message: 'Introduce una duración mayor que cero.',
  path: ['durationHours'],
})

type TrainingInput = z.infer<typeof trainingBaseSchema>
type StoredTrainingSession = {
  id: string
  teamId: string
  seasonId: string
  trainingDate: string
  startTime: string
  durationMinutes: number
  location: z.infer<typeof trainingLocationSchema>
  notes: string
}
type StoredMatchScheduleMeta = {
  matchId: string
  durationMinutes: number
}

const TRAINING_SETTINGS_KEY = 'coordinator_training_sessions'
const MATCH_SCHEDULE_META_SETTINGS_KEY = 'coordinator_match_schedule_meta'
const TEAM_COLORS_SETTINGS_KEY = 'coordinator_team_colors'
const DEFAULT_MATCH_DURATION_MINUTES = 120
const FULL_FIELD_CATEGORIES = ['infantil', 'cadete', 'juvenil', 'senior']
const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i, 'Selecciona un color válido.')

type TeamScheduleInfo = {
  seasonId: string
  categoryName: string
}

function revalidateCalendarPaths() {
  revalidatePath('/admin/calendario')
  revalidatePath('/admin')
  revalidatePath('/calendario')
  revalidatePath('/app/calendario')
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

async function readStoredTrainings(): Promise<StoredTrainingSession[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', TRAINING_SETTINGS_KEY)
    .maybeSingle()

  if (error) throw new Error(error.message)

  try {
    return JSON.parse(data?.value ?? '[]') as StoredTrainingSession[]
  } catch {
    return []
  }
}

async function writeStoredTrainings(trainings: StoredTrainingSession[]) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('app_settings')
    .upsert(
      {
        key: TRAINING_SETTINGS_KEY,
        value: JSON.stringify(trainings),
      },
      { onConflict: 'key' },
    )

  if (error) throw new Error(error.message)
}

async function readStoredMatchScheduleMeta(): Promise<StoredMatchScheduleMeta[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', MATCH_SCHEDULE_META_SETTINGS_KEY)
    .maybeSingle()

  if (error) throw new Error(error.message)

  try {
    return JSON.parse(data?.value ?? '[]') as StoredMatchScheduleMeta[]
  } catch {
    return []
  }
}

async function writeStoredMatchScheduleMeta(rows: StoredMatchScheduleMeta[]) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('app_settings')
    .upsert(
      {
        key: MATCH_SCHEDULE_META_SETTINGS_KEY,
        value: JSON.stringify(rows),
      },
      { onConflict: 'key' },
    )

  if (error) throw new Error(error.message)
}

async function readStoredTeamColors(): Promise<Record<string, string>> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', TEAM_COLORS_SETTINGS_KEY)
    .maybeSingle()

  if (error) throw new Error(error.message)

  try {
    const parsed = JSON.parse(data?.value ?? '{}') as Record<string, string>
    return Object.fromEntries(
      Object.entries(parsed).filter(([, color]) => hexColorSchema.safeParse(color).success),
    )
  } catch {
    return {}
  }
}

async function writeStoredTeamColors(colors: Record<string, string>) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('app_settings')
    .upsert(
      {
        key: TEAM_COLORS_SETTINGS_KEY,
        value: JSON.stringify(colors),
      },
      { onConflict: 'key' },
    )

  if (error) throw new Error(error.message)
}

async function upsertStoredMatchDuration(matchId: string, durationMinutes: number) {
  const rows = await readStoredMatchScheduleMeta()
  const nextRows = [
    ...rows.filter((row) => row.matchId !== matchId),
    { matchId, durationMinutes },
  ]

  await writeStoredMatchScheduleMeta(nextRows)
}

async function deleteStoredMatchDuration(matchId: string) {
  const rows = await readStoredMatchScheduleMeta()
  await writeStoredMatchScheduleMeta(rows.filter((row) => row.matchId !== matchId))
}

function isFullFieldCategory(categoryName: string) {
  const normalized = categoryName.toLowerCase()
  return FULL_FIELD_CATEGORIES.some((category) => normalized.includes(category))
}

function getEffectiveMatchLocation(
  location: z.infer<typeof fieldLocationSchema>,
  categoryName: string,
): z.infer<typeof fieldLocationSchema> {
  return isFullFieldCategory(categoryName) ? 'Campo completo' : location
}

async function getTeamScheduleInfo(teamId: string): Promise<TeamScheduleInfo> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('teams')
    .select('season_id, category_id')
    .eq('id', teamId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('No se ha encontrado el equipo seleccionado.')

  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('name')
    .eq('id', data.category_id)
    .maybeSingle()

  if (categoryError) throw new Error(categoryError.message)

  return {
    seasonId: data.season_id,
    categoryName: category?.name ?? '',
  }
}

function timeToMinutes(value: string | null | undefined) {
  if (!value) return null
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function rangesOverlap(startA: number, durationA: number, startB: number, durationB: number) {
  return startA < startB + durationB && startB < startA + durationA
}

function fieldsConflict(left: z.infer<typeof fieldLocationSchema>, right: z.infer<typeof fieldLocationSchema>) {
  if (left === right) return true
  if (left === 'Anexo' || right === 'Anexo') return false
  return left === 'Campo completo' || right === 'Campo completo'
}

async function assertFieldIsAvailable(input: {
  kind: 'match' | 'training'
  id?: string
  date: string
  startTime: string
  durationMinutes: number
  location: z.infer<typeof fieldLocationSchema>
}) {
  const start = timeToMinutes(input.startTime)
  if (start === null) return

  const supabase = createAdminClient()
  const [{ data: matches, error: matchesError }, { data: teams, error: teamsError }, { data: categories, error: categoriesError }, trainings, matchScheduleMeta] = await Promise.all([
    supabase
      .from('matches')
      .select('id, team_id, match_date, match_time, location, opponent_name')
      .eq('match_date', input.date),
    supabase.from('teams').select('id, category_id'),
    supabase.from('categories').select('id, name'),
    readStoredTrainings(),
    readStoredMatchScheduleMeta(),
  ])

  if (matchesError) throw new Error(matchesError.message)
  if (teamsError) throw new Error(teamsError.message)
  if (categoriesError) throw new Error(categoriesError.message)

  const teamCategoryIdById = new Map((teams ?? []).map((team) => [team.id, team.category_id]))
  const categoryNameById = new Map((categories ?? []).map((category) => [category.id, category.name]))
  const matchDurationById = new Map(matchScheduleMeta.map((row) => [row.matchId, row.durationMinutes]))

  for (const match of matches ?? []) {
    if (input.kind === 'match' && match.id === input.id) continue
    const matchStart = timeToMinutes(match.match_time)
    const parsedLocation = fieldLocationSchema.safeParse(match.location)
    const categoryName = categoryNameById.get(teamCategoryIdById.get(match.team_id) ?? '') ?? ''
    const location = getEffectiveMatchLocation(parsedLocation.success ? parsedLocation.data : 'Campo 1', categoryName)

    if (matchStart === null) continue
    const durationMinutes = matchDurationById.get(match.id) ?? DEFAULT_MATCH_DURATION_MINUTES

    if (!fieldsConflict(input.location, location)) continue
    if (!rangesOverlap(start, input.durationMinutes, matchStart, durationMinutes)) continue

    throw new Error(`Ese campo ya está ocupado por el partido contra ${match.opponent_name ?? 'otro rival'} en esa franja.`)
  }

  for (const training of trainings) {
    if (input.kind === 'training' && training.id === input.id) continue
    if (training.trainingDate !== input.date) continue
    const location = fieldLocationSchema.safeParse(training.location)
    const trainingStart = timeToMinutes(training.startTime)

    if (!location.success || trainingStart === null) continue
    if (!fieldsConflict(input.location, location.data)) continue
    if (!rangesOverlap(start, input.durationMinutes, trainingStart, training.durationMinutes)) continue

    throw new Error('Ese campo ya está ocupado por un entrenamiento en esa franja.')
  }
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

function toMatchPayload(parsed: MatchInput, seasonId: string, location: z.infer<typeof fieldLocationSchema>) {
  const isPlayed = parsed.status === 'played'
  const isLeague = parsed.matchType === 'league'

  const payload: Record<string, string | number | boolean | null> = {
    team_id: parsed.teamId,
    season_id: seasonId,
    opponent_name: parsed.opponentName,
    match_date: parsed.matchDate,
    match_time: parsed.matchTime || null,
    location,
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

function getMatchDurationMinutes(parsed: Pick<MatchInput, 'durationHours' | 'durationMinutes'>) {
  return parsed.durationHours * 60 + parsed.durationMinutes
}

export async function createMatchAction(input: MatchInput): Promise<void> {
  await requireSportsAdminAction()
  const parsed = createMatchSchema.parse(input)
  const teamInfo = await getTeamScheduleInfo(parsed.teamId)
  const location = getEffectiveMatchLocation(parsed.location, teamInfo.categoryName)
  const supabase = createAdminClient()

  await assertFieldIsAvailable({
    kind: 'match',
    date: parsed.matchDate,
    startTime: parsed.matchTime ?? '',
    durationMinutes: getMatchDurationMinutes(parsed),
    location,
  })

  const { data, error } = await supabase
    .from('matches')
    .insert(toMatchPayload(parsed, teamInfo.seasonId, location))
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  await upsertStoredMatchDuration(data.id, getMatchDurationMinutes(parsed))
  revalidateCalendarPaths()
}

export async function createTrainingAction(input: TrainingInput): Promise<void> {
  await requireSportsAdminAction()
  const parsed = createTrainingSchema.parse(input)
  const teamInfo = await getTeamScheduleInfo(parsed.teamId)
  const trainings = await readStoredTrainings()
  const durationMinutes = parsed.durationHours * 60 + parsed.durationMinutes

  await assertFieldIsAvailable({
    kind: 'training',
    date: parsed.trainingDate,
    startTime: parsed.startTime,
    durationMinutes,
    location: parsed.location,
  })

  trainings.push({
    id: crypto.randomUUID(),
    ...toTrainingPayload(parsed, teamInfo.seasonId),
  })
  await writeStoredTrainings(trainings)
  revalidateCalendarPaths()
}

export async function updateTrainingAction(input: TrainingInput & { id: string }): Promise<void> {
  await requireSportsAdminAction()
  const parsed = updateTrainingSchema.parse(input)
  const teamInfo = await getTeamScheduleInfo(parsed.teamId)
  const trainings = await readStoredTrainings()
  const durationMinutes = parsed.durationHours * 60 + parsed.durationMinutes

  await assertFieldIsAvailable({
    kind: 'training',
    id: parsed.id,
    date: parsed.trainingDate,
    startTime: parsed.startTime,
    durationMinutes,
    location: parsed.location,
  })

  const nextTrainings = trainings.map((training) =>
    training.id === parsed.id
      ? {
          id: parsed.id,
          ...toTrainingPayload(parsed, teamInfo.seasonId),
        }
      : training,
  )

  await writeStoredTrainings(nextTrainings)
  revalidateCalendarPaths()
}

export async function deleteTrainingAction(id: string): Promise<void> {
  await requireSportsAdminAction()
  const parsedId = z.string().uuid().parse(id)
  const trainings = await readStoredTrainings()

  await writeStoredTrainings(trainings.filter((training) => training.id !== parsedId))
  revalidateCalendarPaths()
}

export async function updateMatchAction(input: MatchInput & { id: string }): Promise<void> {
  await requireSportsAdminAction()
  const parsed = updateMatchSchema.parse(input)
  const teamInfo = await getTeamScheduleInfo(parsed.teamId)
  const location = getEffectiveMatchLocation(parsed.location, teamInfo.categoryName)
  const supabase = createAdminClient()

  await assertFieldIsAvailable({
    kind: 'match',
    id: parsed.id,
    date: parsed.matchDate,
    startTime: parsed.matchTime ?? '',
    durationMinutes: getMatchDurationMinutes(parsed),
    location,
  })

  const { error } = await supabase
    .from('matches')
    .update(toMatchPayload(parsed, teamInfo.seasonId, location))
    .eq('id', parsed.id)

  if (error) throw new Error(error.message)
  await upsertStoredMatchDuration(parsed.id, getMatchDurationMinutes(parsed))
  if (parsed.playerStats) {
    await saveMatchPlayerStats(parsed.id, parsed.teamId, teamInfo.seasonId, parsed.playerStats)
  }
  revalidateCalendarPaths()
}

export async function deleteMatchAction(id: string): Promise<void> {
  await requireSportsAdminAction()
  const parsedId = z.string().uuid().parse(id)
  const supabase = createAdminClient()
  const { error } = await supabase.from('matches').delete().eq('id', parsedId)

  if (error) throw new Error(error.message)
  await deleteStoredMatchDuration(parsedId)
  revalidateCalendarPaths()
}

export async function updateTeamColorAction(teamId: string, color: string): Promise<void> {
  await requireSportsAdminAction()
  const parsedTeamId = z.string().uuid('No se ha podido identificar el equipo.').parse(teamId)
  const parsedColor = hexColorSchema.parse(color)
  const colors = await readStoredTeamColors()

  await writeStoredTeamColors({
    ...colors,
    [parsedTeamId]: parsedColor.toLowerCase(),
  })
  revalidateCalendarPaths()
}

export async function resetTeamColorAction(teamId: string): Promise<void> {
  await requireSportsAdminAction()
  const parsedTeamId = z.string().uuid('No se ha podido identificar el equipo.').parse(teamId)
  const colors = await readStoredTeamColors()
  const nextColors = { ...colors }
  delete nextColors[parsedTeamId]

  await writeStoredTeamColors(nextColors)
  revalidateCalendarPaths()
}

export async function resetAllTeamColorsAction(): Promise<void> {
  await requireSportsAdminAction()
  await writeStoredTeamColors({})
  revalidateCalendarPaths()
}
