import 'server-only'

import type { createAdminClient } from '@/lib/supabase/admin'

export type TrainingLocation = 'Campo 1' | 'Campo 2' | 'Campo completo' | 'Anexo'

export type StoredTrainingSession = {
  id: string
  teamId: string
  seasonId: string
  trainingDate: string
  startTime: string
  durationMinutes: number
  location: TrainingLocation
  notes: string
  seriesId?: string
}

type AdminSupabaseClient = ReturnType<typeof createAdminClient>

type TrainingSessionDbRow = {
  id: string
  team_id: string
  season_id: string
  training_date: string
  start_time: string
  duration_minutes: number
  location: string
  notes: string | null
  series_id?: string | null
}

const LEGACY_TRAINING_SETTINGS_KEY = 'coordinator_training_sessions'
const TRAINING_TABLE_SELECT =
  'id, team_id, season_id, training_date, start_time, duration_minutes, location, notes, series_id'

function isTrainingTableUnavailable(error: { message?: string; code?: string } | null) {
  if (!error) return false
  const message = error.message?.toLowerCase() ?? ''
  return (
    error.code === '42P01' ||
    error.code === '42703' ||
    message.includes('could not find the table') ||
    message.includes('does not exist') ||
    message.includes('series_id') ||
    message.includes('training_sessions_location_check') ||
    message.includes('schema cache')
  )
}

function fromDbRow(row: TrainingSessionDbRow): StoredTrainingSession {
  return {
    id: row.id,
    teamId: row.team_id,
    seasonId: row.season_id,
    trainingDate: row.training_date,
    startTime: row.start_time?.slice(0, 5) ?? '',
    durationMinutes: row.duration_minutes,
    location: row.location as TrainingLocation,
    notes: row.notes ?? '',
    seriesId: row.series_id ?? undefined,
  }
}

function toDbPayload(training: StoredTrainingSession) {
  return {
    id: training.id,
    team_id: training.teamId,
    season_id: training.seasonId,
    training_date: training.trainingDate,
    start_time: training.startTime,
    duration_minutes: training.durationMinutes,
    location: training.location,
    notes: training.notes || null,
    series_id: training.seriesId ?? null,
  }
}

async function listTableTrainingSessions(supabase: AdminSupabaseClient) {
  const { data, error } = await supabase
    .from('training_sessions')
    .select(TRAINING_TABLE_SELECT)

  if (error) {
    if (isTrainingTableUnavailable(error)) return []
    throw new Error(error.message)
  }

  return ((data ?? []) as TrainingSessionDbRow[]).map(fromDbRow)
}

async function listLegacyTrainingSessions(supabase: AdminSupabaseClient) {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', LEGACY_TRAINING_SETTINGS_KEY)
    .maybeSingle()

  if (error) throw new Error(error.message)

  try {
    return JSON.parse(data?.value ?? '[]') as StoredTrainingSession[]
  } catch {
    return []
  }
}

async function writeLegacyTrainingSessions(
  supabase: AdminSupabaseClient,
  trainings: StoredTrainingSession[],
) {
  const { error } = await supabase
    .from('app_settings')
    .upsert(
      {
        key: LEGACY_TRAINING_SETTINGS_KEY,
        value: JSON.stringify(trainings),
      },
      { onConflict: 'key' },
    )

  if (error) throw new Error(error.message)
}

export async function listTrainingSessions(supabase: AdminSupabaseClient) {
  const [tableTrainings, legacyTrainings] = await Promise.all([
    listTableTrainingSessions(supabase),
    listLegacyTrainingSessions(supabase),
  ])

  const mergedById = new Map<string, StoredTrainingSession>()
  for (const training of legacyTrainings) mergedById.set(training.id, training)
  for (const training of tableTrainings) mergedById.set(training.id, training)

  return Array.from(mergedById.values())
}

export async function createTrainingSession(
  supabase: AdminSupabaseClient,
  training: Omit<StoredTrainingSession, 'id'> & { id?: string },
) {
  const row: StoredTrainingSession = {
    ...training,
    id: training.id ?? crypto.randomUUID(),
  }

  const { error } = await supabase.from('training_sessions').insert(toDbPayload(row))

  if (!error) return row
  if (!isTrainingTableUnavailable(error)) throw new Error(error.message)

  const legacyTrainings = await listLegacyTrainingSessions(supabase)
  await writeLegacyTrainingSessions(supabase, [...legacyTrainings, row])
  return row
}

export async function createTrainingSessions(
  supabase: AdminSupabaseClient,
  trainings: Array<Omit<StoredTrainingSession, 'id'> & { id?: string }>,
) {
  const rows = trainings.map((training) => ({
    ...training,
    id: training.id ?? crypto.randomUUID(),
  }))

  const { error } = await supabase
    .from('training_sessions')
    .insert(rows.map(toDbPayload))

  if (!error) return rows
  if (!isTrainingTableUnavailable(error)) throw new Error(error.message)

  const legacyTrainings = await listLegacyTrainingSessions(supabase)
  await writeLegacyTrainingSessions(supabase, [...legacyTrainings, ...rows])
  return rows
}

export async function updateTrainingSession(
  supabase: AdminSupabaseClient,
  training: StoredTrainingSession,
) {
  const { data, error } = await supabase
    .from('training_sessions')
    .update(toDbPayload(training))
    .eq('id', training.id)
    .select('id')
    .maybeSingle()

  if (error && !isTrainingTableUnavailable(error)) throw new Error(error.message)
  if (data) return

  const legacyTrainings = await listLegacyTrainingSessions(supabase)
  const nextTrainings = legacyTrainings.map((item) =>
    item.id === training.id ? training : item,
  )
  await writeLegacyTrainingSessions(supabase, nextTrainings)
}

export async function deleteTrainingSession(supabase: AdminSupabaseClient, id: string) {
  const { error } = await supabase.from('training_sessions').delete().eq('id', id)
  if (error && !isTrainingTableUnavailable(error)) throw new Error(error.message)

  const legacyTrainings = await listLegacyTrainingSessions(supabase)
  await writeLegacyTrainingSessions(
    supabase,
    legacyTrainings.filter((training) => training.id !== id),
  )
}

export async function deleteTrainingSeries(supabase: AdminSupabaseClient, seriesId: string) {
  const { error } = await supabase
    .from('training_sessions')
    .delete()
    .eq('series_id', seriesId)

  if (error && !isTrainingTableUnavailable(error)) throw new Error(error.message)

  const legacyTrainings = await listLegacyTrainingSessions(supabase)
  await writeLegacyTrainingSessions(
    supabase,
    legacyTrainings.filter((training) => training.seriesId !== seriesId),
  )
}
