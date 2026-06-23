'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdminAction } from '@/lib/auth'
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

const createMatchSchema = matchBaseSchema.omit({ id: true }).refine(
  (value) => value.status !== 'played' || (value.homeScore !== null && value.awayScore !== null),
  {
    message: 'Introduce el resultado para marcar el partido como jugado.',
    path: ['homeScore'],
  },
).refine(
  (value) => value.matchType !== 'league' || Boolean(value.roundLabel?.trim()),
  {
    message: 'Introduce la jornada de liga.',
    path: ['roundLabel'],
  },
)

type MatchInput = z.infer<typeof matchSchema>

function revalidateCalendarPaths() {
  revalidatePath('/admin/calendario')
  revalidatePath('/admin')
  revalidatePath('/calendario')
  revalidatePath('/app/calendario')
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

  return {
    team_id: parsed.teamId,
    season_id: seasonId,
    opponent_name: parsed.opponentName,
    match_date: parsed.matchDate,
    match_time: parsed.matchTime || null,
    location: parsed.location || null,
    is_home: parsed.isHome,
    match_type: parsed.matchType,
    round_label: isLeague ? parsed.roundLabel?.trim() : null,
    status: parsed.status,
    home_score: isPlayed ? parsed.homeScore : null,
    away_score: isPlayed ? parsed.awayScore : null,
    notes: parsed.notes || null,
  }
}

export async function createMatchAction(input: MatchInput): Promise<void> {
  await requireAdminAction()
  const parsed = createMatchSchema.parse(input)
  const seasonId = await getTeamSeasonId(parsed.teamId)
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('matches')
    .insert(toMatchPayload(parsed, seasonId))

  if (error) throw new Error(error.message)
  revalidateCalendarPaths()
}

export async function updateMatchAction(input: MatchInput & { id: string }): Promise<void> {
  await requireAdminAction()
  const parsed = matchSchema.required({ id: true }).parse(input)
  const seasonId = await getTeamSeasonId(parsed.teamId)
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('matches')
    .update(toMatchPayload(parsed, seasonId))
    .eq('id', parsed.id)

  if (error) throw new Error(error.message)
  revalidateCalendarPaths()
}

export async function deleteMatchAction(id: string): Promise<void> {
  await requireAdminAction()
  const parsedId = z.string().uuid().parse(id)
  const supabase = createAdminClient()
  const { error } = await supabase.from('matches').delete().eq('id', parsedId)

  if (error) throw new Error(error.message)
  revalidateCalendarPaths()
}
